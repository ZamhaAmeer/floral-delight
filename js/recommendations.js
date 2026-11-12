/**
 * Floral Delight - Flower Recommendation Engine
 * Calculates matching scores based on occasion, recipient, aesthetic, and budget.
 * Explains reasons for recommendation and connects to shop & bouquet builder.
 */

document.addEventListener('DOMContentLoaded', () => {
  initRecommendations();
});

let userChoices = {
  occasion: 'romance',
  recipient: 'partner',
  aesthetic: 'soft',
  budget: 'all'
};

function initRecommendations() {
  setupOptionChips();
  computeAndRenderRecommendations();
}

function setupOptionChips() {
  document.querySelectorAll('.option-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.getAttribute('data-step');
      const value = btn.getAttribute('data-val');

      // Unselect siblings
      btn.closest('.option-chips-grid').querySelectorAll('.option-chip-btn').forEach(b => {
        b.classList.remove('selected');
      });

      btn.classList.add('selected');
      userChoices[step] = value;
      computeAndRenderRecommendations();
    });
  });
}

function computeAndRenderRecommendations() {
  const container = document.getElementById('recommendations-container');
  const bannerTitle = document.getElementById('rec-banner-title');
  const bannerDesc = document.getElementById('rec-banner-desc');
  if (!container) return;

  // Score flowers
  const scoredFlowers = FLORAL_CATALOG.map(flower => {
    let score = 50; // base score

    // Occasion scoring
    if (flower.occasions.includes(userChoices.occasion)) {
      score += 25;
    }

    // Aesthetic scoring
    if (userChoices.aesthetic === 'soft' && (flower.category === 'romance' || flower.category === 'serene')) {
      score += 15;
    } else if (userChoices.aesthetic === 'vibrant' && flower.category === 'vibrant') {
      score += 18;
    } else if (userChoices.aesthetic === 'serene' && flower.category === 'serene') {
      score += 18;
    } else if (userChoices.aesthetic === 'luxury' && (flower.flowerType === 'orchids' || flower.flowerType === 'mixed' || flower.flowerType === 'tulips')) {
      score += 20;
    }

    // Budget check
    if (userChoices.budget === 'under-4200' && flower.price <= 4200) {
      score += 10;
    } else if (userChoices.budget === '4200-5000' && flower.price >= 4200 && flower.price <= 5000) {
      score += 10;
    } else if (userChoices.budget === 'above-5000' && flower.price >= 5000) {
      score += 10;
    } else if (userChoices.budget === 'all') {
      score += 5;
    }

    // Generate dynamic "Why this flower" rationale
    let rationale = generateRationale(flower, userChoices);

    return {
      ...flower,
      matchScore: Math.min(score, 99),
      rationale
    };
  });

  // Sort descending by score
  scoredFlowers.sort((a, b) => b.matchScore - a.matchScore);

  // Take top 3
  const top3 = scoredFlowers.slice(0, 3);

  // Update banner text
  if (bannerTitle && bannerDesc) {
    const occLabel = getChoiceLabel('occasion', userChoices.occasion);
    const recLabel = getChoiceLabel('recipient', userChoices.recipient);
    bannerTitle.textContent = `Tailored Recommendations for your ${occLabel}`;
    bannerDesc.textContent = `Hand-picked for your ${recLabel} with a focus on ${userChoices.aesthetic} aesthetic harmony and meaningful botanical symbolism.`;
  }

  // Render cards
  container.innerHTML = top3.map((flower, idx) => {
    const wishlisted = isWishlisted(flower.id);
    const rankLabel = idx === 0 ? 'Top Match' : idx === 1 ? 'Alternative Harmony' : 'Creative Pairing';
    return `
      <article class="rec-card">
        <div class="rec-card-media">
          <img src="${flower.image}" alt="${flower.name}">
          <span class="match-score-badge">
            <i class="fa-solid fa-star"></i> ${flower.matchScore}% Match • ${rankLabel}
          </span>
          <button type="button" 
                  class="card-wishlist-btn ${wishlisted ? 'active' : ''}" 
                  data-wishlist-id="${flower.id}" 
                  aria-label="${wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                  onclick="toggleWishlist('${flower.id}')">
            <i class="${wishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>

        <div class="rec-card-body">
          <span class="product-tagline">${flower.tagline}</span>
          <h3 class="rec-card-title">${flower.name}</h3>
          <div class="rec-card-price">Rs. ${flower.price.toLocaleString()}</div>

          <div class="why-recommended-box">
            <h4><i class="fa-solid fa-lightbulb"></i> Why This Bloom is Recommended</h4>
            <p>${flower.rationale}</p>
          </div>

          <div class="rec-actions">
            <a href="Contact.html?inquiry=order&product=${encodeURIComponent(flower.name)}&price=${flower.price}" class="btn btn-primary" style="width: 100%;">
              <i class="fa-solid fa-bag-shopping"></i> Order This Recommendation
            </a>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button type="button" class="btn btn-sm btn-secondary" onclick="addFlowerToBuilder('${flower.id}')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> In Builder
              </button>
              <a href="flower-meanings.html#meaning-${flower.id}" class="btn btn-sm btn-outline">
                <i class="fa-solid fa-book-open"></i> Full Meaning
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function generateRationale(flower, choices) {
  if (flower.flowerType === 'roses' || flower.id.startsWith('rose')) {
    return `With its velvety petals in ${flower.color}, this bouquet communicates profound adoration and warmth, perfectly honoring your ${getChoiceLabel('recipient', choices.recipient)} during this ${getChoiceLabel('occasion', choices.occasion)}.`;
  }
  if (flower.flowerType === 'lotus' || flower.id.startsWith('lotus')) {
    return `Sacred Lotus blossoms represent spiritual enlightenment, purity of intention, and serene tranquility—ideal for meaningful, reverent celebrations.`;
  }
  if (flower.flowerType === 'tulips' || flower.id.startsWith('tulip')) {
    return `Dutch Tulips symbolize enduring devotion and graceful beginnings. Their tender silhouette offers an elegant, understated romance without being overwhelming.`;
  }
  if (flower.flowerType === 'lilies' || flower.id.startsWith('lily')) {
    return `The serene fragrance and majestic pure petals of the Lily evoke heartfelt honor, sincere care, and peaceful devotion, providing a refined botanical presence.`;
  }
  if (flower.flowerType === 'orchids' || flower.id.startsWith('orchid')) {
    return `Exotic Phalaenopsis Orchids represent rare beauty and deep respect. Their sculptural stems stay radiant for weeks, reflecting thoughtful sophistication.`;
  }
  if (flower.flowerType === 'sunflowers' || flower.id.startsWith('sunflower')) {
    return `Radiant golden sunflowers represent infectious joy, optimism, and loyalty—an uplifting choice guaranteed to bring beaming smiles and warm energy.`;
  }
  if (flower.flowerType === 'carnations' || flower.id.startsWith('carnation')) {
    return `Ruffled garden carnations are historically celebrated for expressing deep gratitude and tender affection, making them deeply meaningful for cherished loved ones.`;
  }
  if (flower.flowerType === 'daisies' || flower.id.startsWith('daisy')) {
    return `Fresh meadow daisies radiate youthful innocence, cheerfulness, and bright optimism, effortlessly lifting spirits.`;
  }
  if (flower.flowerType === 'lavender' || flower.id.startsWith('lavender')) {
    return `Aromatic French lavender brings a tranquil, spa-like calming presence. Its soothing scent and muted silver-violet hue convey healing and serene peace.`;
  }
  if (flower.flowerType === 'mixed' || flower.id === 'all-in-one') {
    return `Combining our finest roses, lilies, and seasonal stems into a luxurious symphony, this grand arrangement offers an unforgettable celebratory experience for your milestone.`;
  }
  if (flower.id === 'dahlias') {
    return `Intricate geometric symmetry and rich warm petals symbolize inner dignity and lasting commitment, elevating any celebratory atmosphere.`;
  }
  return `${flower.name} balances natural beauty with heartfelt emotion (${flower.meaning}), fitting your ${choices.aesthetic} aesthetic preference seamlessly.`;
}

function getChoiceLabel(type, val) {
  const dict = {
    occasion: {
      romance: 'Romance & Anniversary',
      birthday: 'Birthday Celebration',
      graduation: 'Graduation & Milestone',
      getwellsoon: 'Comfort & Healing',
      thanksgiving: 'Gratitude & Thanks',
      everyday: 'Sanctuary & Everyday'
    },
    recipient: {
      partner: 'Partner',
      mother: 'Mother / Parent',
      friend: 'Cherished Friend',
      colleague: 'Colleague',
      self: 'Personal Space'
    }
  };
  return (dict[type] && dict[type][val]) || val;
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

