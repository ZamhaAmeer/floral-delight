/**
 * Floral Delight - Products / Shop Client-Side Controller
 * Renders flower products, search, category & occasion filtering,
 * price sorting, quick-view modal, and builder integration.
 * Integrated with Django REST Framework backend & PostgreSQL database.
 */

let currentCategory = 'all';
let currentOccasion = 'all';
let currentSort = 'default';
let searchKeyword = '';
let backendProducts = [];
let backendCategories = [];
let isLoadingProducts = false;

/**
 * Normalizes product object whether loaded from DRF API or static catalog.
 */
function normalizeProduct(raw) {
  if (!raw) return null;
  const flowerId = raw.slug || (raw.id ? String(raw.id) : '');
  const categorySlug = raw.category_slug || (raw.category && raw.category.slug) || raw.flower_type || raw.category || 'mixed';
  const flowerType = raw.flower_type || categorySlug;
  const priceNum = typeof raw.price === 'string' ? parseFloat(raw.price) : (raw.price || 0);
  const imageUrl = (window.apiClient && typeof window.apiClient.resolveImageUrl === 'function')
    ? window.apiClient.resolveImageUrl(raw.image || 'Images/hero-bouquet.jpg')
    : (raw.image || 'Images/hero-bouquet.jpg');

  return {
    id: flowerId,
    slug: flowerId,
    numericId: raw.id,
    name: raw.name || 'Floral Arrangement',
    tagline: raw.tagline || `${raw.color || 'Artisanal'} Harvest`,
    flowerType: flowerType,
    category: categorySlug,
    categoryName: raw.category_name || (raw.category && raw.category.name) || flowerType,
    price: priceNum,
    image: imageUrl,
    occasions: Array.isArray(raw.occasions) ? raw.occasions : (raw.occasions ? [raw.occasions] : []),
    color: raw.color || 'Blush & Botanical',
    meaning: raw.meaning || raw.description || 'Elegantly arranged seasonal blooms.',
    season: raw.season || 'Fresh Harvest',
    stemLength: raw.stem_length || raw.stemLength || '45-50 cm',
    fragrance: raw.fragrance || 'Subtle Natural Aroma',
    description: raw.description || raw.meaning || 'Handcrafted fresh floral stems, carefully wrapped with satin ribbon.',
    isAvailable: raw.is_available !== false,
  };
}

/**
 * Retrieves a flower product by either slug or integer ID.
 */
function getFlowerById(flowerId) {
  if (!flowerId) return null;
  const idStr = String(flowerId).toLowerCase();

  // 1. Check in loaded backendProducts
  if (backendProducts && backendProducts.length > 0) {
    const match = backendProducts.find(p =>
      (p.id && String(p.id).toLowerCase() === idStr) ||
      (p.slug && String(p.slug).toLowerCase() === idStr) ||
      (p.numericId && String(p.numericId) === idStr)
    );
    if (match) return match;
  }

  // 2. Check in global catalog FLORAL_CATALOG if available
  if (typeof FLORAL_CATALOG !== 'undefined' && Array.isArray(FLORAL_CATALOG)) {
    const match = FLORAL_CATALOG.find(p =>
      (p.id && String(p.id).toLowerCase() === idStr) ||
      (p.slug && String(p.slug).toLowerCase() === idStr)
    );
    if (match) return normalizeProduct(match);
  }

  return null;
}

function setupModalHandlers() {
  document.addEventListener('keydown', (e) => {
    if (e && e.key === 'Escape') closeProductModal();
  });
}

function initShopPage() {
  setupFilterListeners();
  setupModalHandlers();
  initBotanicalFlipBook();
  loadProductsFromBackend();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShopPage);
} else {
  initShopPage();
}

/**
 * Asynchronously loads flower products and categories from Django REST API.
 */
async function loadProductsFromBackend() {
  const grid = document.getElementById('products-grid');
  isLoadingProducts = true;

  if (grid) {
    grid.innerHTML = `
      <div class="products-loading-box">
        <i class="fa-solid fa-circle-notch fa-spin spinner-icon"></i>
        <h3>Gathering Fresh Morning Harvest...</h3>
        <p>Connecting to Floral Delight botanical inventory in PostgreSQL...</p>
      </div>
    `;
  }

  try {
    if (!window.apiClient) {
      throw new Error('API Client not initialized');
    }

    const [productsData, categoriesData] = await Promise.all([
      window.apiClient.get('/api/products/'),
      window.apiClient.get('/api/products/categories/').catch(err => {
        console.warn('Category list fetch warning:', err);
        return [];
      })
    ]);

    if (Array.isArray(productsData) && productsData.length > 0) {
      backendProducts = productsData.map(normalizeProduct);
      if (Array.isArray(categoriesData)) {
        backendCategories = categoriesData;
      }
      isLoadingProducts = false;
      renderProducts();
      return;
    }
    throw new Error('Empty product list returned from API');
  } catch (error) {
    console.warn('Could not load products from API, checking fallback:', error);
    isLoadingProducts = false;

    // Graceful fallback to FLORAL_CATALOG if available
    if (typeof FLORAL_CATALOG !== 'undefined' && Array.isArray(FLORAL_CATALOG) && FLORAL_CATALOG.length > 0) {
      backendProducts = FLORAL_CATALOG.map(normalizeProduct);
      renderProducts();
      if (typeof showToast === 'function') {
        showToast('Viewing seasonal catalog.', 'fa-leaf');
      }
    } else {
      if (grid) {
        grid.innerHTML = `
          <div class="products-error-box">
            <i class="fa-solid fa-triangle-exclamation error-icon"></i>
            <h3>Unable to Connect to Flower API</h3>
            <p>We are currently unable to reach our boutique server at <code>/api/products/</code>. Please ensure the Django backend server is running.</p>
            <button type="button" class="btn btn-sm btn-primary" onclick="loadProductsFromBackend()">
              <i class="fa-solid fa-arrow-rotate-right"></i> Retry Connection
            </button>
          </div>
        `;
      }
    }
  }
}

/**
 * Renders filtered and sorted product cards into the grid.
 */
function renderProducts() {
  if (isLoadingProducts) return;

  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  const catalog = (backendProducts && backendProducts.length > 0)
    ? backendProducts
    : (typeof FLORAL_CATALOG !== 'undefined' ? FLORAL_CATALOG.map(normalizeProduct) : []);

  // Filter products
  let filtered = catalog.filter(flower => {
    let matchesCategory = true;
    const fType = (flower.flowerType || flower.category || '').toLowerCase();
    const fId = (flower.id || '').toLowerCase();
    const fName = (flower.name || '').toLowerCase();

    if (currentCategory === 'all') {
      matchesCategory = true;
    } else if (currentCategory === 'roses') {
      matchesCategory = fType === 'roses' || fId.startsWith('rose') || fName.includes('rose');
    } else if (currentCategory === 'lotus') {
      matchesCategory = fType === 'lotus' || fId.startsWith('lotus') || fName.includes('lotus');
    } else if (currentCategory === 'tulips') {
      matchesCategory = fType === 'tulips' || fId.startsWith('tulip') || fName.includes('tulip');
    } else if (currentCategory === 'lilies') {
      matchesCategory = fType === 'lilies' || fId.startsWith('lily') || fName.includes('lily');
    } else if (currentCategory === 'orchids') {
      matchesCategory = fType === 'orchids' || fId.startsWith('orchid') || fName.includes('orchid');
    } else if (currentCategory === 'sunflowers') {
      matchesCategory = fType === 'sunflowers' || fId.startsWith('sunflower') || fName.includes('sunflower');
    } else if (currentCategory === 'carnations') {
      matchesCategory = fType === 'carnations' || fId.startsWith('carnation') || fName.includes('carnation');
    } else if (currentCategory === 'daisies') {
      matchesCategory = fType === 'daisies' || fId.startsWith('daisy') || fName.includes('daisy');
    } else if (currentCategory === 'lavender') {
      matchesCategory = fType === 'lavender' || fId.startsWith('lavender') || fName.includes('lavender');
    } else if (currentCategory === 'anthurium') {
      matchesCategory = fType === 'anthurium' || fId.startsWith('anthurium') || fName.includes('anthurium');
    } else if (currentCategory === 'dahlias' || currentCategory === 'dahlia') {
      matchesCategory = fType === 'dahlias' || fType === 'dahlia' || fId.startsWith('dahlia') || fName.includes('dahlia');
    } else if (currentCategory === 'mixed') {
      matchesCategory = fType === 'mixed' || fId.startsWith('mixed') || fId === 'all-in-one' || fName.includes('mixed');
    } else {
      matchesCategory = fType === currentCategory || (flower.category && flower.category.toLowerCase() === currentCategory);
    }

    let matchesOccasion = true;
    if (currentOccasion !== 'all') {
      if (Array.isArray(flower.occasions)) {
        matchesOccasion = flower.occasions.includes(currentOccasion);
      } else if (typeof flower.occasions === 'string') {
        matchesOccasion = flower.occasions.toLowerCase().includes(currentOccasion.toLowerCase());
      } else {
        matchesOccasion = false;
      }
    }

    let matchesSearch = true;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      matchesSearch =
        (flower.name && flower.name.toLowerCase().includes(kw)) ||
        (flower.meaning && flower.meaning.toLowerCase().includes(kw)) ||
        (flower.color && flower.color.toLowerCase().includes(kw)) ||
        (flower.tagline && flower.tagline.toLowerCase().includes(kw)) ||
        (flower.description && flower.description.toLowerCase().includes(kw)) ||
        (flower.flowerType && flower.flowerType.toLowerCase().includes(kw));
    }

    return matchesCategory && matchesOccasion && matchesSearch;
  });

  // Sort products
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Update count & active category indicator
  const totalCount = catalog.length;
  if (countEl) {
    if (currentCategory === 'all') {
      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of ${totalCount} Curated Bouquets`;
    } else {
      const catLabel = getCategoryLabel(currentCategory);
      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> ${catLabel} <button type="button" class="tag-clear-btn" onclick="resetAllFilters()" title="Return to all bouquets">&times; View All</button>`;
    }
  }

  // Handle empty state
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-box">
        <i class="fa-solid fa-seedling"></i>
        <h3>No Flowers Found</h3>
        <p>No floral stems match your current filter criteria. Try clearing your search or filters.</p>
        <button type="button" class="btn btn-sm btn-primary" onclick="resetAllFilters()" style="margin-top: 14px;">
          Reset Filters
        </button>
      </div>
    `;
    return;
  }

  // Render product cards
  grid.innerHTML = filtered.map(flower => {
    const wishlisted = typeof isWishlisted === 'function' ? isWishlisted(flower.id) : false;
    return `
      <article class="product-card" id="product-${flower.id}">
        <div class="product-media">
          <img src="${flower.image}" alt="${flower.name}" loading="lazy">
          <span class="product-badge">${flower.tagline}</span>
          <button type="button" 
                  class="card-wishlist-btn ${wishlisted ? 'active' : ''}" 
                  data-wishlist-id="${flower.id}" 
                  aria-label="${wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                  onclick="toggleWishlist('${flower.id}')">
            <i class="${wishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>
        <div class="product-body">
          <span class="product-tagline">${flower.color} • ${flower.season}</span>
          <h3 class="product-title">${flower.name}</h3>
          <div class="product-price-row">
            <span class="product-price">Rs. ${flower.price.toLocaleString()}</span>
            <span class="product-freshness"><i class="fa-solid fa-leaf"></i> Fresh Harvest</span>
          </div>
          <p class="product-desc">${flower.meaning}</p>
          
          <div class="product-card-actions">
            <div class="btn-group-row">
              <button type="button" class="btn btn-sm btn-outline" onclick="openProductModal('${flower.id}')">
                <i class="fa-solid fa-eye"></i> Quick View
              </button>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addFlowerToBuilder('${flower.id}')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> In Builder
              </button>
            </div>
            <a href="Contact.html?inquiry=order&product=${encodeURIComponent(flower.name)}&price=${flower.price}" class="btn btn-sm btn-primary" style="width: 100%;">
              <i class="fa-solid fa-bag-shopping"></i> Order This Bloom
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function setupFilterListeners() {
  // Search input
  const searchInput = document.getElementById('shop-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }

  // Category filter pills
  const catBtns = document.querySelectorAll('.cat-filter-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderProducts();
    });
  });

  // Occasion filter dropdown
  const occasionSelect = document.getElementById('occasion-filter');
  if (occasionSelect) {
    occasionSelect.addEventListener('change', (e) => {
      currentOccasion = e.target.value;
      renderProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sort-filter');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }
}

function resetAllFilters() {
  currentCategory = 'all';
  currentOccasion = 'all';
  currentSort = 'default';
  searchKeyword = '';

  const searchInput = document.getElementById('shop-search');
  if (searchInput) searchInput.value = '';

  const occasionSelect = document.getElementById('occasion-filter');
  if (occasionSelect) occasionSelect.value = 'all';

  const sortSelect = document.getElementById('sort-filter');
  if (sortSelect) sortSelect.value = 'default';

  document.querySelectorAll('.cat-filter-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-category') === 'all');
  });

  renderProducts();
  if (typeof showToast === 'function') {
    showToast('Showing all bouquet collections', 'fa-arrow-rotate-left');
  }
}

function getCategoryLabel(cat) {
  const labels = {
    'all': 'All Bouquets',
    'roses': 'Roses',
    'lotus': 'Lotus Bouquets',
    'tulips': 'Tulip Bouquets',
    'lilies': 'Lily Bouquets',
    'orchids': 'Orchid Bouquets',
    'sunflowers': 'Sunflower Bouquets',
    'carnations': 'Carnation Bouquets',
    'daisies': 'Daisy Bouquets',
    'lavender': 'Lavender Bouquets',
    'anthurium': 'Anthurium Bouquets',
    'dahlias': 'Dahlia Bouquets',
    'dahlia': 'Dahlia Bouquets',
    'mixed': 'Mixed Flower Bouquets'
  };
  return labels[cat] || cat;
}

/* Add flower to Bouquet Builder */
function addFlowerToBuilder(flowerId) {
  try {
    localStorage.setItem('floral_builder_seed', flowerId);
    if (typeof showToast === 'function') {
      showToast('Stem added to Custom Bouquet Builder! 🌿', 'fa-wand-magic-sparkles');
    }
    setTimeout(() => {
      window.location.href = 'bouquet-builder.html';
    }, 700);
  } catch (e) {
    window.location.href = 'bouquet-builder.html';
  }
}

/* ==========================================================================
   Quick View Modal Logic (Connected to Backend Products API)
   ========================================================================== */
async function openProductModal(flowerId) {
  let flower = getFlowerById(flowerId);

  // If not found in memory, attempt fetching from DRF backend endpoint
  if (!flower && window.apiClient) {
    try {
      const data = await window.apiClient.get(`/api/products/${flowerId}/`);
      if (data) {
        flower = normalizeProduct(data);
      }
    } catch (err) {
      console.warn('Could not fetch single product detail:', err);
    }
  }

  if (!flower) return;

  const modalContainer = document.getElementById('product-modal-container');
  if (!modalContainer) return;

  const wishlisted = typeof isWishlisted === 'function' ? isWishlisted(flower.id) : false;

  modalContainer.innerHTML = `
    <div class="floral-modal-overlay open" id="active-modal-overlay" onclick="closeProductModal(event)">
      <div class="floral-modal" onclick="event.stopPropagation()">
        <button type="button" class="modal-close-btn" aria-label="Close modal" onclick="closeProductModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="modal-product-grid">
          <div class="modal-media">
            <img src="${flower.image}" alt="${flower.name}">
          </div>
          <div class="modal-content-body">
            <span class="product-tagline">${flower.tagline}</span>
            <h2 class="modal-product-title">${flower.name}</h2>
            <div class="modal-price">Rs. ${flower.price.toLocaleString()}</div>
            
            <div class="modal-meaning-box">
              <strong>Symbolic Meaning:</strong> ${flower.meaning}
            </div>

            <p style="font-size: 0.92rem; color: var(--dark-charcoal-muted); margin-bottom: 16px;">
              ${flower.description}
            </p>

            <div class="modal-specs-list">
              <div class="spec-item">
                <span class="spec-label">Stem Height</span>
                <span class="spec-val">${flower.stemLength}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Fragrance Profile</span>
                <span class="spec-val">${flower.fragrance}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Peak Season</span>
                <span class="spec-val">${flower.season}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Colour Palette</span>
                <span class="spec-val">${flower.color}</span>
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: auto;">
              <a href="Contact.html?inquiry=order&product=${encodeURIComponent(flower.name)}&price=${flower.price}" class="btn btn-sm btn-primary" style="flex: 1;">
                <i class="fa-solid fa-bag-shopping"></i> Order Bloom
              </a>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addFlowerToBuilder('${flower.id}')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Use in Builder
              </button>
              <button type="button" 
                      class="btn btn-sm btn-outline card-wishlist-btn-modal ${wishlisted ? 'active' : ''}" 
                      onclick="if (typeof toggleWishlist === 'function') toggleWishlist('${flower.id}'); this.classList.toggle('active');">
                <i class="fa-solid fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeProductModal(event) {
  if (event && event.target.id !== 'active-modal-overlay' && !event.target.closest('.modal-close-btn')) {
    return;
  }
  const overlay = document.getElementById('active-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.remove();
    }, 250);
  }
}


/* ==========================================================================
   Botanical Flip-Book Atelier (Interactive 3D Page Turn Controller)
   ========================================================================== */
function initBotanicalFlipBook() {
  const bookWrapper = document.getElementById('botanical-lookbook');
  if (!bookWrapper) return;

  const spreads = Array.from(bookWrapper.querySelectorAll('.book-spread'));
  const dots = Array.from(bookWrapper.querySelectorAll('.book-dot'));
  const prevBtn = document.getElementById('book-prev-btn');
  const nextBtn = document.getElementById('book-next-btn');
  const pageLabel = document.getElementById('book-page-label');
  const flippingLeaf = document.getElementById('book-flipping-leaf');
  const tempoFill = document.getElementById('book-tempo-fill');

  if (!spreads.length) return;

  const leafFront = flippingLeaf ? flippingLeaf.querySelector('.leaf-front') : null;
  const leafBack = flippingLeaf ? flippingLeaf.querySelector('.leaf-back') : null;

  let currentIndex = 0;
  let isFlipping = false;
  let autoFlipTimer = null;
  let hoverResumeTimer = null;
  const totalPages = spreads.length;

  function triggerTempoBar() {
    if (!tempoFill) return;
    tempoFill.style.transition = 'none';
    tempoFill.style.width = '0%';
    void tempoFill.offsetWidth; // force browser layout recalculation
    tempoFill.style.transition = 'width 2.8s linear';
    tempoFill.style.width = '100%';
  }

  function goToPage(targetIndex, direction = 'next') {
    if (isFlipping) return;
    if (targetIndex === currentIndex) return;
    isFlipping = true;

    const currentSpread = spreads[currentIndex];
    const targetSpread = spreads[targetIndex];

    if (!currentSpread || !targetSpread) {
      isFlipping = false;
      return;
    }

    const currentRight = currentSpread.querySelector('.book-page-right');
    const currentLeft = currentSpread.querySelector('.book-page-left');
    const targetRight = targetSpread.querySelector('.book-page-right');
    const targetLeft = targetSpread.querySelector('.book-page-left');

    if (flippingLeaf && leafFront && leafBack) {
      if (direction === 'next') {
        // Flipping forward: Right leaf curls & swings across spine to Left
        flippingLeaf.style.left = '50%';
        flippingLeaf.style.transformOrigin = 'left center';
        leafFront.innerHTML = currentRight ? currentRight.innerHTML : '';
        leafBack.innerHTML = targetLeft ? targetLeft.innerHTML : '';

        // Reveal target spread underneath so target right details are exposed as leaf lifts
        if (targetSpread.style) {
          targetSpread.style.zIndex = '1';
          targetSpread.style.visibility = 'visible';
          targetSpread.style.opacity = '1';
        }
        if (currentSpread.style) {
          currentSpread.style.zIndex = '2';
        }

        flippingLeaf.className = 'book-flipping-leaf is-flipping flip-forward';
      } else {
        // Flipping backward: Left leaf curls & swings across spine to Right
        flippingLeaf.style.left = '0%';
        flippingLeaf.style.transformOrigin = 'right center';
        leafFront.innerHTML = currentLeft ? currentLeft.innerHTML : '';
        leafBack.innerHTML = targetRight ? targetRight.innerHTML : '';

        if (targetSpread.style) {
          targetSpread.style.zIndex = '1';
          targetSpread.style.visibility = 'visible';
          targetSpread.style.opacity = '1';
        }
        if (currentSpread.style) {
          currentSpread.style.zIndex = '2';
        }

        flippingLeaf.className = 'book-flipping-leaf is-flipping flip-backward';
      }
    }

    // Complete transition after 3D animation ends (680ms)
    setTimeout(() => {
      spreads.forEach((s, idx) => {
        s.classList.toggle('active', idx === targetIndex);
        if (s.style) {
          s.style.zIndex = '';
          s.style.visibility = '';
          s.style.opacity = '';
        }
      });

      if (flippingLeaf) {
        flippingLeaf.className = 'book-flipping-leaf';
        flippingLeaf.style.left = '';
        flippingLeaf.style.transformOrigin = '';
        if (leafFront) leafFront.innerHTML = '';
        if (leafBack) leafBack.innerHTML = '';
      }

      currentIndex = targetIndex;
      isFlipping = false;

      // Update dots
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === targetIndex);
      });

      // Update page counter label
      if (pageLabel) {
        pageLabel.textContent = `Page ${targetIndex + 1} of ${totalPages}`;
      }

      triggerTempoBar();
    }, 680);
  }

  function nextPage() {
    const nextIdx = (currentIndex + 1) % totalPages;
    goToPage(nextIdx, 'next');
  }

  function prevPage() {
    const prevIdx = (currentIndex - 1 + totalPages) % totalPages;
    goToPage(prevIdx, 'prev');
  }

  // Next and Prev button listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextPage();
      resetAutoFlip();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevPage();
      resetAutoFlip();
    });
  }

  // Dot navigation listeners
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
      if (!isNaN(targetIdx) && targetIdx !== currentIndex) {
        const dir = targetIdx > currentIndex ? 'next' : 'prev';
        goToPage(targetIdx, dir);
        resetAutoFlip();
      }
    });
  });

  // Lively auto-slideshow loop (turns page every 2.8 seconds)
  function startAutoFlip() {
    stopAutoFlip();
    triggerTempoBar();
    autoFlipTimer = setInterval(() => {
      if (!document.hidden) {
        nextPage();
      }
    }, 2800);
  }

  function stopAutoFlip() {
    if (autoFlipTimer) {
      clearInterval(autoFlipTimer);
      autoFlipTimer = null;
    }
    if (tempoFill) {
      tempoFill.style.transition = 'none';
      tempoFill.style.width = '0%';
    }
  }

  function resetAutoFlip() {
    stopAutoFlip();
    startAutoFlip();
  }

  // Mouse interaction: pause briefly so user can click, but resume after 4.5s so it never freezes
  bookWrapper.addEventListener('mouseenter', () => {
    stopAutoFlip();
    clearTimeout(hoverResumeTimer);
    hoverResumeTimer = setTimeout(() => {
      startAutoFlip();
    }, 4500);
  });

  bookWrapper.addEventListener('mouseleave', () => {
    clearTimeout(hoverResumeTimer);
    startAutoFlip();
  });

  // Initial tempo bar trigger & prompt first flip after 1.0s
  triggerTempoBar();
  setTimeout(() => {
    nextPage();
    startAutoFlip();
  }, 1000);
}

