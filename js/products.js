/**
 * Floral Delight - Products / Shop Client-Side Controller
 * Renders flower products, search, category & occasion filtering,
 * price sorting, quick-view modal, and builder integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  initShopPage();
});

let currentCategory = 'all';
let currentOccasion = 'all';
let currentSort = 'default';
let searchKeyword = '';

function initShopPage() {
  renderProducts();
  setupFilterListeners();
  setupModalHandlers();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  // Filter products
  let filtered = FLORAL_CATALOG.filter(flower => {
    const matchesCategory = currentCategory === 'all' || flower.category === currentCategory;
    const matchesOccasion = currentOccasion === 'all' || flower.occasions.includes(currentOccasion);
    const matchesSearch = searchKeyword === '' || 
      flower.name.toLowerCase().includes(searchKeyword) ||
      flower.meaning.toLowerCase().includes(searchKeyword) ||
      flower.tagline.toLowerCase().includes(searchKeyword);

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

  // Update count
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${FLORAL_CATALOG.length} Curated Stems`;
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
    const wishlisted = isWishlisted(flower.id);
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
  showToast('Filters have been reset', 'fa-arrow-rotate-left');
}

/* Add flower to Bouquet Builder */
function addFlowerToBuilder(flowerId) {
  try {
    localStorage.setItem('floral_builder_seed', flowerId);
    showToast('Stem added to Custom Bouquet Builder! 🌿', 'fa-wand-magic-sparkles');
    setTimeout(() => {
      window.location.href = 'bouquet-builder.html';
    }, 700);
  } catch (e) {
    window.location.href = 'bouquet-builder.html';
  }
}

/* ==========================================================================
   Quick View Modal Logic
   ========================================================================== */
function openProductModal(flowerId) {
  const flower = getFlowerById(flowerId);
  if (!flower) return;

  const modalContainer = document.getElementById('product-modal-container');
  if (!modalContainer) return;

  const wishlisted = isWishlisted(flower.id);

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
                      onclick="toggleWishlist('${flower.id}'); this.classList.toggle('active');">
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

