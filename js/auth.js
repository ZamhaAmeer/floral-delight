/**
 * Floral Delight - Customer Authentication & State Controller
 * Manages login, registration, session persistence, header profile pills,
 * and profile dashboard interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initGlobalAuthHeader();
  initAuthPage();
  initAccountPage();
});

// ==============================================================================
// 1. Global Navigation Header Auth State Sync
// ==============================================================================
function initGlobalAuthHeader() {
  renderAuthHeaderAction();

  // Listen for login/logout across tabs or within the page
  window.addEventListener('auth:change', () => {
    renderAuthHeaderAction();
  });
  window.addEventListener('auth:user_updated', () => {
    renderAuthHeaderAction();
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.user-menu-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

function renderAuthHeaderAction() {
  const headerActions = document.querySelector('.header-actions');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!headerActions || !window.apiClient) return;

  // Remove existing auth elements if already present
  const existingBtn = headerActions.querySelector('.auth-nav-action');
  if (existingBtn) existingBtn.remove();

  const isAuth = window.apiClient.isAuthenticated();
  const user = window.apiClient.getUser();

  const container = document.createElement('div');
  container.className = 'auth-nav-action';
  container.style.display = 'inline-block';

  if (isAuth && user) {
    const firstName = (user.full_name || 'Customer').split(' ')[0];
    container.innerHTML = `
      <div class="user-menu-dropdown">
        <button type="button" class="user-menu-btn" aria-label="Open customer account menu">
          <i class="fa-solid fa-circle-user"></i>
          <span>Hi, ${escapeHtml(firstName)}</span>
          <i class="fa-solid fa-angle-down"></i>
        </button>
        <div class="user-dropdown-menu">
          <div class="user-dropdown-header">
            <strong>${escapeHtml(user.full_name)}</strong>
            <small>${escapeHtml(user.email)}</small>
          </div>
          <a href="account.html"><i class="fa-solid fa-id-card"></i> My Profile</a>
          <a href="wishlist.html"><i class="fa-solid fa-heart"></i> Saved Wishlist</a>
          <a href="reviews.html"><i class="fa-solid fa-star"></i> My Reviews</a>
          <hr>
          <button type="button" class="logout-link" id="nav-logout-btn">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </div>
    `;

    // Toggle dropdown
    const toggleBtn = container.querySelector('.user-menu-btn');
    const dropdown = container.querySelector('.user-menu-dropdown');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Logout click
    const logoutBtn = container.querySelector('#nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.apiClient.auth.logout();
        if (window.location.pathname.includes('account.html')) {
          window.location.href = 'login.html';
        } else {
          renderAuthHeaderAction();
        }
      });
    }
  } else {
    // Logged Out State
    container.innerHTML = `
      <a href="login.html" class="auth-nav-btn" aria-label="Sign In or Register">
        <i class="fa-regular fa-user"></i>
        <span>Sign In</span>
      </a>
    `;
  }

  // Insert before the mobile hamburger toggle
  const mobileToggle = headerActions.querySelector('.mobile-toggle');
  if (mobileToggle) {
    headerActions.insertBefore(container, mobileToggle);
  } else {
    headerActions.appendChild(container);
  }
}

// ==============================================================================
// 2. Login & Registration Page Handlers (login.html)
// ==============================================================================
function initAuthPage() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabBtns = document.querySelectorAll('.auth-tab-btn');
  const tabContents = document.querySelectorAll('.auth-tab-content');

  if (!loginForm && !registerForm) return;

  // If already logged in, redirect to home or account
  if (window.apiClient && window.apiClient.isAuthenticated()) {
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('next') || 'account.html';
    window.location.href = redirectUrl;
    return;
  }

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(tabTarget);
      if (activeContent) activeContent.classList.add('active');
    });
  });

  // Password visibility toggle
  document.querySelectorAll('.auth-password-toggle').forEach(toggleBtn => {
    toggleBtn.addEventListener('click', () => {
      const input = toggleBtn.closest('.auth-input-wrapper').querySelector('input');
      const icon = toggleBtn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(loginForm);

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = loginForm.querySelector('.auth-submit-btn');

      setButtonLoading(submitBtn, true, 'Signing In...');

      const res = await window.apiClient.auth.login({ email, password });

      setButtonLoading(submitBtn, false, 'Sign In to Your Account');

      if (res.ok) {
        showToast('Login successful. Welcome back to Floral Delight! 🌸', 'fa-circle-check');
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('next') || 'account.html';
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 800);
      } else {
        showBannerError(loginForm, res.message || 'Invalid email or password.');
      }
    });
  }

  // Handle Registration Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(registerForm);

      const fullName = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const submitBtn = registerForm.querySelector('.auth-submit-btn');

      // Client-side quick check
      if (password !== confirmPassword) {
        showFieldError(registerForm, 'reg-confirm-password', 'Passwords do not match.');
        return;
      }

      setButtonLoading(submitBtn, true, 'Creating Account...');

      const res = await window.apiClient.auth.register({
        full_name: fullName,
        email,
        phone_number: phone,
        password,
        confirm_password: confirmPassword
      });

      setButtonLoading(submitBtn, false, 'Create Customer Account');

      if (res.ok) {
        showToast('Welcome to Floral Delight! Account created successfully. 🌸', 'fa-circle-check');
        setTimeout(() => {
          window.location.href = 'account.html';
        }, 900);
      } else {
        if (res.errors && typeof res.errors === 'object') {
          // Display field specific error or banner
          Object.entries(res.errors).forEach(([field, msg]) => {
            const errorText = Array.isArray(msg) ? msg[0] : msg;
            if (field === 'email') showFieldError(registerForm, 'reg-email', errorText);
            else if (field === 'password') showFieldError(registerForm, 'reg-password', errorText);
            else if (field === 'confirm_password') showFieldError(registerForm, 'reg-confirm-password', errorText);
            else if (field === 'full_name') showFieldError(registerForm, 'reg-name', errorText);
            else showBannerError(registerForm, errorText);
          });
        } else {
          showBannerError(registerForm, res.message || 'Registration failed.');
        }
      }
    });
  }
}

// ==============================================================================
// 3. Customer Profile Dashboard Handlers (account.html)
// ==============================================================================
async function initAccountPage() {
  const profileContainer = document.getElementById('profile-dashboard');
  if (!profileContainer) return;

  // Protect page: require login
  if (!window.apiClient || !window.apiClient.isAuthenticated()) {
    window.location.href = 'login.html?next=account.html';
    return;
  }

  // Load fresh profile from backend
  const res = await window.apiClient.auth.getProfile();
  if (res.ok && res.data && res.data.user) {
    renderProfileData(res.data.user);
  } else {
    // If token invalid, redirect to login
    window.apiClient.auth.logout();
    window.location.href = 'login.html?next=account.html';
  }

  // Update profile form
  const profileForm = document.getElementById('profile-edit-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('prof-name').value.trim();
      const phone = document.getElementById('prof-phone').value.trim();
      const btn = profileForm.querySelector('.auth-submit-btn');

      setButtonLoading(btn, true, 'Saving Changes...');
      const updateRes = await window.apiClient.auth.updateProfile({
        full_name: fullName,
        phone_number: phone
      });
      setButtonLoading(btn, false, 'Save Profile Changes');

      if (updateRes.ok) {
        showToast('Profile updated successfully! 🌸', 'fa-circle-check');
        renderProfileData(updateRes.data.user);
      } else {
        showToast(updateRes.message || 'Could not update profile.', 'fa-circle-exclamation');
      }
    });
  }

  // Change password form
  const passwordForm = document.getElementById('change-password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('old-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmNewPassword = document.getElementById('confirm-new-password').value;
      const btn = passwordForm.querySelector('.auth-submit-btn');

      if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match.', 'fa-triangle-exclamation');
        return;
      }

      setButtonLoading(btn, true, 'Updating Password...');
      const passRes = await window.apiClient.auth.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      });
      setButtonLoading(btn, false, 'Update Password');

      if (passRes.ok) {
        showToast('Password changed securely! 🌸', 'fa-shield-halved');
        passwordForm.reset();
      } else {
        const errorMsg = passRes.errors && passRes.errors.old_password ? passRes.errors.old_password[0] : (passRes.message || 'Password change failed.');
        showToast(errorMsg, 'fa-triangle-exclamation');
      }
    });
  }
}

function renderProfileData(user) {
  if (!user) return;
  const nameDisplay = document.getElementById('profile-name-display');
  const emailDisplay = document.getElementById('profile-email-display');
  const phoneDisplay = document.getElementById('profile-phone-display');
  const avatarLetter = document.getElementById('profile-avatar-letter');
  const nameInput = document.getElementById('prof-name');
  const phoneInput = document.getElementById('prof-phone');

  if (nameDisplay) nameDisplay.textContent = user.full_name;
  if (emailDisplay) emailDisplay.textContent = user.email;
  if (phoneDisplay) phoneDisplay.textContent = user.phone_number || 'Not provided';
  if (avatarLetter) avatarLetter.textContent = (user.full_name || 'C')[0].toUpperCase();
  if (nameInput) nameInput.value = user.full_name || '';
  if (phoneInput) phoneInput.value = user.phone_number || '';
}

// ==============================================================================
// 4. Utility UI Helpers
// ==============================================================================
function setButtonLoading(btn, isLoading, text) {
  if (!btn) return;
  btn.disabled = isLoading;
  if (isLoading) {
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${text}</span>`;
  } else {
    btn.innerHTML = `<span>${text}</span>`;
  }
}

function showBannerError(form, message) {
  const banner = form.querySelector('.auth-banner-error');
  if (banner) {
    banner.textContent = message;
    banner.style.display = 'block';
  }
}

function showFieldError(form, inputId, message) {
  const input = form.querySelector(`#${inputId}`);
  if (input) {
    const group = input.closest('.auth-form-group');
    if (group) {
      let errEl = group.querySelector('.auth-field-error');
      if (errEl) {
        errEl.textContent = message;
        errEl.style.display = 'block';
      }
    }
  }
}

function clearFormErrors(form) {
  const banner = form.querySelector('.auth-banner-error');
  if (banner) banner.style.display = 'none';

  form.querySelectorAll('.auth-field-error').forEach(el => {
    el.style.display = 'none';
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
