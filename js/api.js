/**
 * Floral Delight - Centralized API Service & HTTP Client
 * Connects frontend interfaces to Django REST Framework + PostgreSQL backend.
 * Handles JWT access/refresh tokens, automatic 401 token recovery, and media URLs.
 */

(function (window) {
  'use strict';

  // 1. Centralized Backend Base URL
  // In local development, Django runs on port 8000
  const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000';

  // 2. Storage Keys
  const ACCESS_TOKEN_KEY = 'floral_delight_access_token';
  const REFRESH_TOKEN_KEY = 'floral_delight_refresh_token';
  const USER_PROFILE_KEY = 'floral_delight_user_profile';

  // 3. Token & User State Helpers
  function getAccessToken() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  function getRefreshToken() {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  function setTokens(access, refresh) {
    try {
      if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      window.dispatchEvent(new CustomEvent('auth:change', { detail: { isAuthenticated: true } }));
    } catch (e) {
      console.error('Error storing auth tokens:', e);
    }
  }

  function clearAuth() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
      window.dispatchEvent(new CustomEvent('auth:change', { detail: { isAuthenticated: false } }));
    } catch (e) {
      console.error('Error clearing auth:', e);
    }
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('auth:user_updated', { detail: { user } }));
    } catch (e) {
      console.error('Error storing user profile:', e);
    }
  }

  function isAuthenticated() {
    return Boolean(getAccessToken());
  }

  // 4. Resolve Image URLs (Static vs Media vs Remote)
  function resolveImageUrl(imagePath) {
    if (!imagePath) return 'Images/hero-bouquet.jpg';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/media/') || imagePath.startsWith('media/')) {
      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${API_BASE_URL}${cleanPath}`;
    }
    // Local static frontend path
    return imagePath;
  }

  // 5. Automatic Refresh Lock to Prevent Thundering Herd
  let isRefreshing = false;
  let refreshSubscribers = [];

  function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
  }

  function onRefreshed(newAccessToken) {
    refreshSubscribers.forEach(cb => cb(newAccessToken));
    refreshSubscribers = [];
  }

  async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) {
      clearAuth();
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
      });

      if (!response.ok) {
        clearAuth();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      if (data && data.access) {
        setTokens(data.access, data.refresh || refresh);
        return data.access;
      }
      clearAuth();
      throw new Error('Invalid token response');
    } catch (err) {
      clearAuth();
      throw err;
    }
  }

  // 6. Core Generic API Request Method
  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = options.headers ? { ...options.headers } : {};

    // Attach Authorization header if access token exists and not explicitly excluded
    const token = getAccessToken();
    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set JSON Content-Type if body is not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      let response = await fetch(url, config);

      // Handle Token Expiry: If 401 Unauthorized and we have a refresh token, try to refresh and retry
      if (response.status === 401 && !options._retry && getRefreshToken() && !options.skipAuth && !url.includes('/accounts/login/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshAccessToken();
            isRefreshing = false;
            onRefreshed(newToken);
          } catch (refreshErr) {
            isRefreshing = false;
            return parseResponse(response);
          }
        }

        // Wait for token refresh and retry
        const retryPromise = new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            resolve(request(endpoint, { ...options, headers: retryHeaders, _retry: true }));
          });
        });

        return retryPromise;
      }

      return parseResponse(response);
    } catch (networkError) {
      console.warn(`[Floral Delight API] Network failure on ${endpoint}:`, networkError);
      return {
        ok: false,
        status: 0,
        message: 'Could not connect to the Floral Delight backend server. Please verify the Django server is running on port 8000.',
        errors: { network: ['Server unreachable'] }
      };
    }
  }

  async function parseResponse(response) {
    let data = null;
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (err) {
      data = null;
    }

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        data
      };
    }

    // Extract user-friendly error message from DRF format
    let message = 'An unexpected error occurred. Please try again.';
    let errors = {};

    if (data && typeof data === 'object') {
      if (data.message) {
        message = data.message;
      } else if (data.detail) {
        message = data.detail;
      }

      if (data.errors) {
        errors = data.errors;
      } else {
        errors = data;
      }
    }

    return {
      ok: false,
      status: response.status,
      message,
      errors,
      raw: data
    };
  }

  // 7. High-Level Modular Client Interface
  const apiClient = {
    BASE_URL: API_BASE_URL,

    // Token & Auth State
    getAccessToken,
    getRefreshToken,
    getUser,
    setUser,
    setTokens,
    clearAuth,
    isAuthenticated,
    resolveImageUrl,

    // HTTP Verbs
    get(endpoint, params = null) {
      let url = endpoint;
      if (params && typeof params === 'object') {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            query.append(k, v);
          }
        });
        const queryString = query.toString();
        if (queryString) url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
      return request(url, { method: 'GET' });
    },

    post(endpoint, body = null, isFormData = false) {
      return request(endpoint, {
        method: 'POST',
        body: isFormData ? body : (body ? JSON.stringify(body) : null)
      });
    },

    put(endpoint, body = null, isFormData = false) {
      return request(endpoint, {
        method: 'PUT',
        body: isFormData ? body : (body ? JSON.stringify(body) : null)
      });
    },

    patch(endpoint, body = null, isFormData = false) {
      return request(endpoint, {
        method: 'PATCH',
        body: isFormData ? body : (body ? JSON.stringify(body) : null)
      });
    },

    delete(endpoint) {
      return request(endpoint, { method: 'DELETE' });
    },

    // 8. Auth API Module
    auth: {
      async register(userData) {
        const res = await apiClient.post('/api/accounts/register/', userData);
        if (res.ok && res.data && res.data.tokens) {
          setTokens(res.data.tokens.access, res.data.tokens.refresh);
          if (res.data.user) setUser(res.data.user);
        }
        return res;
      },

      async login(credentials) {
        const res = await apiClient.post('/api/accounts/login/', credentials);
        if (res.ok && res.data && res.data.tokens) {
          setTokens(res.data.tokens.access, res.data.tokens.refresh);
          if (res.data.user) setUser(res.data.user);
        }
        return res;
      },

      logout() {
        clearAuth();
        if (typeof window.showToast === 'function') {
          window.showToast('You have been signed out. Have a fragrant day! 🌸', 'fa-arrow-right-from-bracket');
        }
      },

      async getProfile() {
        const res = await apiClient.get('/api/accounts/profile/');
        if (res.ok && res.data && res.data.user) {
          setUser(res.data.user);
        }
        return res;
      },

      async updateProfile(profileData) {
        const res = await apiClient.patch('/api/accounts/profile/', profileData);
        if (res.ok && res.data && res.data.user) {
          setUser(res.data.user);
        }
        return res;
      },

      async changePassword(passwordData) {
        return apiClient.post('/api/accounts/change-password/', passwordData);
      }
    }
  };

  // Expose to global scope
  window.apiClient = apiClient;

})(window);
