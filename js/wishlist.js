/**
 * Floral Delight - Smart Wishlist Controller
 * Manages LocalStorage retrieval, rendering saved flowers,
 * removal transitions, and empty state management.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderWishlistPage();

  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      renderWishlistPage();
    }
  });
});

function renderWishlistPage() {
  const container = document.getElementById('wishlist-container');
  const countDisplay = document.getElementById('wishlist-total-display');
  const clearBtn = document.getElementById('clear-wishlist-btn');
  if (!container) return;

  const savedIds = getWishlist();
  const savedFlowers = savedIds.map(id => getFlowerById(id)).filter(Boolean);

  if (countDisplay) {
    countDisplay.textContent = `You have ${savedFlowers.length} Saved Botanical ${savedFlowers.length === 1 ? 'Item' : 'Items'}`;
  }

  if (clearBtn) {
    clearBtn.style.display = savedFlowers.length > 0 ? 'inline-flex' : 'none';
  }

  if (savedFlowers.length === 0) {
    container.innerHTML = `
      <div class="wishlist-empty-card">
        <i class="fa-regular fa-heart"></i>
        <h3>Your Wishlist is Empty</h3>
        <p>
          You haven't saved any floral stems yet. Browse our curated collection, take our recommendation guide, or customize your dream bouquet to save your favorites.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="Products.html" class="btn btn-primary">
            <i class="fa-solid fa-bag-shopping"></i> Browse Curated Collections
          </a>
          <a href="recommendations.html" class="btn btn-outline">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Get Recommendations
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="wishlist-grid">
      ${savedFlowers.map(flower => `
        <article class="product-card" id="wishlist-item-${flower.id}">
          <div class="product-media">
            <img src="${flower.image}" alt="${flower.name}">
            <span class="product-badge">${flower.tagline}</span>
            <button type="button" 
                    class="card-wishlist-btn active" 
                    aria-label="Remove from Wishlist"
                    onclick="removeFromWishlistPage('${flower.id}')">
              <i class="fa-solid fa-heart"></i>
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
                <button type="button" class="btn btn-sm btn-secondary" onclick="addFlowerToBuilder('${flower.id}')">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> In Builder
                </button>
                <button type="button" class="btn btn-sm btn-outline" onclick="removeFromWishlistPage('${flower.id}')">
                  <i class="fa-solid fa-trash-can"></i> Remove
                </button>
              </div>
              <a href="Contact.html?inquiry=order&product=${encodeURIComponent(flower.name)}&price=${flower.price}" class="btn btn-sm btn-primary" style="width: 100%;">
                <i class="fa-solid fa-bag-shopping"></i> Order This Bloom
              </a>
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function removeFromWishlistPage(flowerId) {
  const card = document.getElementById(`wishlist-item-${flowerId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    setTimeout(() => {
      toggleWishlist(flowerId);
      renderWishlistPage();
    }, 250);
  } else {
    toggleWishlist(flowerId);
    renderWishlistPage();
  }
}

function clearAllWishlist() {
  if (confirm('Are you sure you want to clear all saved items from your wishlist?')) {
    saveWishlist([]);
    renderWishlistPage();
    showToast('Wishlist has been cleared', 'fa-trash-can');
  }
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

