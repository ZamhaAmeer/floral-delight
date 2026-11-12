/**
 * Floral Delight - Custom Bouquet Builder & Virtual Preview Controller
 * Manages stem selection, wrapping, ribbons, live itemized calculations,
 * and virtual bouquet visual preview updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  initBouquetBuilder();
});

// Packaging definitions
const WRAPPING_OPTIONS = [
  { id: 'linen-ivory', name: 'Warm Ivory Linen', price: 300, color: '#F9F1EF', border: '#E8C5C4' },
  { id: 'silk-blush', name: 'Soft Blush Silk Wrap', price: 400, color: '#E8C5C4', border: '#B9828C' },
  { id: 'kraft-sage', name: 'Sage Botanical Kraft Paper', price: 200, color: '#DCE3DA', border: '#899982' },
  { id: 'luxe-charcoal', name: 'Midnight Charcoal Luxe', price: 350, color: '#453B3B', border: '#6B5F5F' }
];

const RIBBON_OPTIONS = [
  { id: 'ribbon-rose', name: 'Dusty Rose Satin Ribbon', price: 150, color: '#B9828C' },
  { id: 'ribbon-sage', name: 'Sage Organza Ribbon', price: 150, color: '#899982' },
  { id: 'ribbon-gold', name: 'Gold Botanical Cord', price: 200, color: '#D4AF37' }
];

// Builder State
let builderState = {
  stems: {}, // { flowerId: quantity }
  wrap: WRAPPING_OPTIONS[1], // default Soft Blush Silk
  ribbon: RIBBON_OPTIONS[0]  // default Dusty Rose Satin
};
let currentStemFilter = 'all';

function initBouquetBuilder() {
  setupStemFilterTabs();
  renderStemSelectors();
  renderPackagingOptions();
  renderRibbonOptions();
  checkPreseededFlower();
  updateBouquet();
}

function setupStemFilterTabs() {
  const tabs = document.querySelectorAll('#stem-filter-tabs .stem-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStemFilter = tab.getAttribute('data-flowertype');
      renderStemSelectors();
    });
  });
}

/* Render stem items */
function renderStemSelectors() {
  const container = document.getElementById('stems-selector-list');
  if (!container) return;

  const list = currentStemFilter === 'all'
    ? FLORAL_CATALOG
    : FLORAL_CATALOG.filter(f => f.flowerType === currentStemFilter);

  container.innerHTML = list.map(flower => {
    const qty = builderState.stems[flower.id] || 0;
    return `
      <div class="stem-select-item" id="stem-item-${flower.id}">
        <div class="stem-item-info">
          <img src="${flower.image}" alt="${flower.name}" class="stem-thumb-img">
          <div>
            <h4>${flower.name}</h4>
            <span class="stem-item-price">Rs. ${flower.price.toLocaleString()} / stem</span>
          </div>
        </div>

        <div class="qty-stepper">
          <button type="button" class="stepper-btn" onclick="changeStemQty('${flower.id}', -1)" aria-label="Decrease quantity">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="qty-val-display" id="qty-val-${flower.id}">${qty}</span>
          <button type="button" class="stepper-btn" onclick="changeStemQty('${flower.id}', 1)" aria-label="Increase quantity">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* Render wrapping options */
function renderPackagingOptions() {
  const container = document.getElementById('wrapping-options-grid');
  if (!container) return;

  container.innerHTML = WRAPPING_OPTIONS.map(wrap => {
    const isSelected = builderState.wrap.id === wrap.id;
    return `
      <div class="addon-card ${isSelected ? 'selected' : ''}" 
           onclick="selectWrapping('${wrap.id}')"
           id="wrap-card-${wrap.id}">
        <div class="addon-swatch" style="background-color: ${wrap.color}; border-color: ${wrap.border};"></div>
        <div>
          <h4>${wrap.name}</h4>
          <span class="addon-price">+Rs. ${wrap.price}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* Render ribbon options */
function renderRibbonOptions() {
  const container = document.getElementById('ribbon-options-grid');
  if (!container) return;

  container.innerHTML = RIBBON_OPTIONS.map(ribbon => {
    const isSelected = builderState.ribbon.id === ribbon.id;
    return `
      <div class="addon-card ${isSelected ? 'selected' : ''}" 
           onclick="selectRibbon('${ribbon.id}')"
           id="ribbon-card-${ribbon.id}">
        <div class="addon-swatch" style="background-color: ${ribbon.color};"></div>
        <div>
          <h4>${ribbon.name}</h4>
          <span class="addon-price">+Rs. ${ribbon.price}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* Quantity modification */
function changeStemQty(flowerId, delta) {
  const current = builderState.stems[flowerId] || 0;
  const next = Math.max(0, Math.min(24, current + delta)); // max 24 per stem type

  if (next === 0) {
    delete builderState.stems[flowerId];
  } else {
    builderState.stems[flowerId] = next;
  }

  const el = document.getElementById(`qty-val-${flowerId}`);
  if (el) el.textContent = next;

  updateBouquet();
}

/* Select Wrapping */
function selectWrapping(wrapId) {
  const found = WRAPPING_OPTIONS.find(w => w.id === wrapId);
  if (!found) return;

  builderState.wrap = found;
  document.querySelectorAll('#wrapping-options-grid .addon-card').forEach(card => {
    card.classList.toggle('selected', card.id === `wrap-card-${wrapId}`);
  });

  updateBouquet();
}

/* Select Ribbon */
function selectRibbon(ribbonId) {
  const found = RIBBON_OPTIONS.find(r => r.id === ribbonId);
  if (!found) return;

  builderState.ribbon = found;
  document.querySelectorAll('#ribbon-options-grid .addon-card').forEach(card => {
    card.classList.toggle('selected', card.id === `ribbon-card-${ribbonId}`);
  });

  updateBouquet();
}

/* Check if pre-seeded from Shop or Recommendations */
function checkPreseededFlower() {
  try {
    const seed = localStorage.getItem('floral_builder_seed');
    if (seed && getFlowerById(seed)) {
      builderState.stems[seed] = 2; // initial 2 stems
      localStorage.removeItem('floral_builder_seed');
      
      const el = document.getElementById(`qty-val-${seed}`);
      if (el) el.textContent = 2;

      showToast(`Added ${getFlowerById(seed).name} to your bouquet canvas!`, 'fa-wand-magic-sparkles');
    }
  } catch (e) {
    console.error(e);
  }
}

/* Master Update Function: Calculates Price and Updates Virtual Preview */
function updateBouquet() {
  const previewStage = document.getElementById('preview-stage');
  const breakdownList = document.getElementById('breakdown-items-list');
  const totalDisplay = document.getElementById('total-price-display');
  const stemCounterBadge = document.getElementById('stage-stem-count');

  let stemTotal = 0;
  let totalStemsCount = 0;
  let activeStems = [];

  for (const [id, qty] of Object.entries(builderState.stems)) {
    if (qty > 0) {
      const flower = getFlowerById(id);
      if (flower) {
        stemTotal += flower.price * qty;
        totalStemsCount += qty;
        activeStems.push({ ...flower, qty });
      }
    }
  }

  const grandTotal = stemTotal + builderState.wrap.price + builderState.ribbon.price;

  // Update total stem count badge
  if (stemCounterBadge) {
    stemCounterBadge.textContent = `${totalStemsCount} Stems Selected`;
  }

  // Update Total Price display
  if (totalDisplay) {
    totalDisplay.textContent = `Rs. ${grandTotal.toLocaleString()}`;
  }

  // Update Workbench Hero Stats Box if present
  const wbStemCounter = document.getElementById('workbench-stem-counter');
  if (wbStemCounter) {
    wbStemCounter.textContent = `${totalStemsCount} Stem${totalStemsCount === 1 ? '' : 's'}`;
  }
  const wbPriceCounter = document.getElementById('workbench-price-counter');
  if (wbPriceCounter) {
    wbPriceCounter.textContent = `Rs. ${grandTotal.toLocaleString()}`;
  }

  // ==========================================
  // Update Itemized Breakdown
  // ==========================================
  if (breakdownList) {
    if (activeStems.length === 0) {
      breakdownList.innerHTML = `
        <div class="breakdown-line empty-placeholder">
          <span>No floral stems selected yet. Click (+) above to compose your bouquet.</span>
        </div>
        <div class="breakdown-line">
          <span class="line-title">🎀 Packaging: ${builderState.wrap.name}</span>
          <span class="line-price">Rs. ${builderState.wrap.price}</span>
        </div>
        <div class="breakdown-line">
          <span class="line-title">🎗️ Ribbon: ${builderState.ribbon.name}</span>
          <span class="line-price">Rs. ${builderState.ribbon.price}</span>
        </div>
      `;
    } else {
      let lines = activeStems.map(item => `
        <div class="breakdown-line">
          <span class="line-title">🌸 ${item.name} (×${item.qty})</span>
          <span class="line-price">Rs. ${(item.price * item.qty).toLocaleString()}</span>
        </div>
      `).join('');

      lines += `
        <div class="breakdown-line">
          <span class="line-title">🎀 Packaging: ${builderState.wrap.name}</span>
          <span class="line-price">Rs. ${builderState.wrap.price}</span>
        </div>
        <div class="breakdown-line">
          <span class="line-title">🎗️ Ribbon: ${builderState.ribbon.name}</span>
          <span class="line-price">Rs. ${builderState.ribbon.price}</span>
        </div>
      `;

      breakdownList.innerHTML = lines;
    }
  }

  // ==========================================
  // Update Virtual Flower Preview Visualizer
  // ==========================================
  if (previewStage) {
    if (activeStems.length === 0) {
      previewStage.innerHTML = `
        <div class="empty-stage-state">
          <i class="fa-solid fa-seedling"></i>
          <h4 style="font-size: 1.1rem; margin-bottom: 4px;">Atelier Canvas Ready</h4>
          <p style="font-size: 0.85rem;">Select stems on the left to see your virtual bouquet bloom.</p>
        </div>
      `;
    } else {
      // Create visual cluster
      const bubbles = activeStems.map(stem => `
        <div class="virtual-stem-bubble" title="${stem.name} (×${stem.qty})">
          <img src="${stem.image}" alt="${stem.name}">
          <span class="stem-badge-count">${stem.qty}</span>
        </div>
      `).join('');

      previewStage.innerHTML = `
        <div class="stage-bouquet-wrap">
          <!-- Stems Cluster Layer -->
          <div class="virtual-stems-cluster">
            ${bubbles}
          </div>

          <!-- Wrapping Paper Sleeve -->
          <div class="virtual-wrap-sleeve" style="background-color: ${builderState.wrap.color}; border-color: ${builderState.wrap.border};"></div>

          <!-- Ribbon Bow Overlay -->
          <div class="virtual-ribbon-tie" style="background-color: ${builderState.ribbon.color};">
            <div class="virtual-ribbon-bow"></div>
          </div>
        </div>
      `;
    }
  }

  // Update Inquire button href
  const orderBtn = document.getElementById('order-custom-btn');
  if (orderBtn) {
    const stemSummary = activeStems.map(s => `${s.name} (x${s.qty})`).join(', ') || 'Custom Bouquet';
    const params = new URLSearchParams({
      inquiry: 'custom_bouquet',
      stems: stemSummary,
      wrap: builderState.wrap.name,
      ribbon: builderState.ribbon.name,
      total: `Rs. ${grandTotal.toLocaleString()}`
    });
    orderBtn.href = `Contact.html?${params.toString()}`;
  }
}

/* Reset Builder */
function resetBouquetBuilder() {
  builderState.stems = {};
  builderState.wrap = WRAPPING_OPTIONS[1];
  builderState.ribbon = RIBBON_OPTIONS[0];

  document.querySelectorAll('.qty-val-display').forEach(el => el.textContent = '0');
  renderPackagingOptions();
  renderRibbonOptions();
  updateBouquet();

  showToast('Bouquet studio has been reset', 'fa-arrow-rotate-left');
}

/* Save Custom Bouquet to Wishlist */
function saveCustomBouquetToWishlist() {
  const activeEntries = Object.entries(builderState.stems).filter(([_, q]) => q > 0);
  if (activeEntries.length === 0) {
    showToast('Please select at least one flower stem before saving!', 'fa-circle-exclamation');
    return;
  }

  // Save primary stem to wishlist as representative
  const primaryId = activeEntries[0][0];
  toggleWishlist(primaryId);
  showToast('Custom bouquet creation saved to Wishlist! 🌸', 'fa-heart');
}

