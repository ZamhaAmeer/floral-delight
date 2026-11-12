/**
 * Floral Delight - Flower Meaning Explorer Controller
 * Search, filter by emotional theme, render botanical floriography encyclopedia,
 * and connect to Shop & Bouquet Builder.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMeaningsPage();
});

let currentTheme = 'all';
let meaningSearch = '';

function initMeaningsPage() {
  renderMeaningsGrid();
  setupMeaningControls();
}

function renderMeaningsGrid() {
  const grid = document.getElementById('meanings-grid');
  const countEl = document.getElementById('meanings-count');
  if (!grid) return;

  const filtered = FLORAL_CATALOG.filter(flower => {
    let matchesTheme = true;
    if (currentTheme === 'romance') {
      matchesTheme = flower.category === 'romance' || flower.flowerType === 'roses' || flower.flowerType === 'tulips';
    } else if (currentTheme === 'serenity') {
      matchesTheme = flower.category === 'serene' || flower.flowerType === 'lilies' || flower.flowerType === 'lotus' || flower.flowerType === 'lavender';
    } else if (currentTheme === 'joy') {
      matchesTheme = flower.category === 'vibrant' || flower.flowerType === 'sunflowers' || flower.flowerType === 'daisies';
    } else if (currentTheme === 'gratitude') {
      matchesTheme = flower.occasions.includes('thanksgiving') || flower.flowerType === 'carnations';
    }

    const matchesSearch = meaningSearch === '' || 
      flower.name.toLowerCase().includes(meaningSearch) ||
      flower.meaning.toLowerCase().includes(meaningSearch) ||
      flower.tagline.toLowerCase().includes(meaningSearch) ||
      flower.color.toLowerCase().includes(meaningSearch);

    return matchesTheme && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${FLORAL_CATALOG.length} Botanical Meanings`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-box" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-book-open"></i>
        <h3>No Meanings Found</h3>
        <p>No floral symbolism matches "${meaningSearch}". Try searching for love, peace, gratitude, or specific flowers.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(flower => {
    const wishlisted = isWishlisted(flower.id);
    const occasionPills = flower.occasions.map(occ => `
      <span class="occ-micro-badge">${occ.charAt(0).toUpperCase() + occ.slice(1)}</span>
    `).join('');

    return `
      <article class="meaning-card" id="meaning-${flower.id}">
        <div class="meaning-card-media">
          <img src="${flower.image}" alt="${flower.name}" loading="lazy">
          <button type="button" 
                  class="card-wishlist-btn ${wishlisted ? 'active' : ''}" 
                  data-wishlist-id="${flower.id}" 
                  aria-label="${wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                  onclick="toggleWishlist('${flower.id}')">
            <i class="${wishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>

        <div class="meaning-card-body">
          <span class="botanical-plate-badge"><i class="fa-solid fa-feather-pointed"></i> Herbarium Plate</span>
          <span class="meaning-kicker">${flower.tagline}</span>
          <h3 class="meaning-card-title">${flower.name}</h3>
          
          <div class="meaning-core-box">
            <i class="fa-solid fa-feather-pointed" style="color: var(--dusty-rose-dark); margin-right: 4px;"></i>
            ${flower.meaning}
          </div>

          <p class="meaning-desc-text">
            ${flower.description}
          </p>

          <div style="font-size: 0.8rem; font-weight: 700; color: var(--dark-charcoal); margin-bottom: 6px;">
            Ideal For:
          </div>
          <div class="meaning-occasions-row">
            ${occasionPills}
          </div>

          <div class="meaning-card-actions">
            <a href="Products.html#product-${flower.id}" class="btn btn-sm btn-primary">
              <i class="fa-solid fa-bag-shopping"></i> View Bouquet (Rs. ${flower.price.toLocaleString()})
            </a>
            <button type="button" class="btn btn-sm btn-secondary" onclick="addFlowerToBuilder('${flower.id}')">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Build
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function setupMeaningControls() {
  const searchInput = document.getElementById('meaning-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      meaningSearch = e.target.value.trim().toLowerCase();
      renderMeaningsGrid();
    });
  }

  const themeBtns = document.querySelectorAll('.emotion-pill-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTheme = btn.getAttribute('data-theme');
      renderMeaningsGrid();
    });
  });
}

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

