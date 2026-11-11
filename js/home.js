/**
 * Floral Delight - Homepage Interactive Experience
 * Handles navigation, interactive filters, recommendation finder,
 * and custom bouquet atelier studio.
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initCollectionFilter();
  initRecommendationFinder();
  initCustomBouquetStudio();
  initBackToTop();
});

/* ==========================================================================
   1. Sticky Header Scroll Effect
   ========================================================================== */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ==========================================================================
   2. Mobile Navigation Toggle
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!toggleBtn || !mobileNav) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    toggleBtn.innerHTML = isOpen 
      ? '<i class="fa-solid fa-xmark"></i>' 
      : '<i class="fa-solid fa-bars"></i>';
  });

  // Close mobile nav on link click
  mobileNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

/* ==========================================================================
   3. Featured Flower Collections Filter
   ========================================================================== */
function initCollectionFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.collection-card');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category.includes(filterValue)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   4. Flower Recommendation Guide ("Find Your Perfect Bloom")
   ========================================================================== */
function initRecommendationFinder() {
  const occasionChips = document.querySelectorAll('.occasion-chip');
  const vibeChips = document.querySelectorAll('.vibe-chip');

  const recImg = document.getElementById('rec-image');
  const recTitle = document.getElementById('rec-title');
  const recMeaning = document.getElementById('rec-meaning');
  const recPrice = document.getElementById('rec-price');
  const recLink = document.getElementById('rec-link');

  if (!occasionChips.length || !vibeChips.length || !recTitle) return;

  // Recommendation Knowledge Base
  const recommendationMatrix = {
    'romance-soft': {
      title: 'Tulip Flower Bouquet',
      image: 'Images/Tulip.jpg',
      price: 'Rs. 5,500',
      meaning: 'Symbol of pure, enduring love and tender devotion.'
    },
    'romance-bold': {
      title: 'Velvet Rose Flower',
      image: 'Images/rose.jpg',
      price: 'Rs. 4,300',
      meaning: 'Deep romantic passion, elegance, and timeless adoration.'
    },
    'romance-calm': {
      title: 'Graceful Lily Flower',
      image: 'Images/Lily.jpg',
      price: 'Rs. 4,200',
      meaning: 'Serene devotion, honor, and purity of heart.'
    },
    'birthday-bold': {
      title: 'Golden Sunflower',
      image: 'Images/Sunflower.jpg',
      price: 'Rs. 4,100',
      meaning: 'Radiant energy, adoration, and cheerful long life.'
    },
    'birthday-soft': {
      title: 'Country Dahlias',
      image: 'Images/Dahlias.jpeg',
      price: 'Rs. 4,500',
      meaning: 'Elegance, inner dignity, and heartfelt celebration.'
    },
    'birthday-calm': {
      title: 'Fresh Daisy Flower',
      image: 'Images/daisy.jpg',
      price: 'Rs. 4,000',
      meaning: 'Joyful smiles, innocence, and brand new chapters.'
    },
    'thanks-soft': {
      title: 'Carnation Flower',
      image: 'Images/carnation.jpg',
      price: 'Rs. 3,800',
      meaning: 'Profound appreciation, sweet gratitude, and affection.'
    },
    'thanks-bold': {
      title: 'All-in-One Grand Bouquet',
      image: 'Images/all in one.jpg',
      price: 'Rs. 6,000',
      meaning: 'A grand gesture of gratefulness for someone extraordinary.'
    },
    'thanks-calm': {
      title: 'Phalaenopsis Orchid',
      image: 'Images/Orchid.jpg',
      price: 'Rs. 5,200',
      meaning: 'Exquisite refinement and high esteem.'
    },
    'comfort-calm': {
      title: 'French Lavender Flower',
      image: 'Images/Lavender.jpg',
      price: 'Rs. 4,300',
      meaning: 'Aromatic tranquility, calm spirit, and soothing comfort.'
    },
    'comfort-soft': {
      title: 'Peaceful Lotus Flower',
      image: 'Images/lotus.jpg',
      price: 'Rs. 3,800',
      meaning: 'Resilience, rebirth, and spiritual tranquility.'
    },
    'comfort-bold': {
      title: 'Anthurium Flower',
      image: 'Images/Anthurium.jpg',
      price: 'Rs. 4,000',
      meaning: 'Warmth, hospitality, and persevering hope.'
    }
  };

  let selectedOccasion = 'romance';
  let selectedVibe = 'soft';

  function updateRecommendation() {
    const key = `${selectedOccasion}-${selectedVibe}`;
    const result = recommendationMatrix[key] || recommendationMatrix['romance-soft'];

    recTitle.textContent = result.title;
    recImg.src = result.image;
    recImg.alt = result.title;
    recMeaning.textContent = result.meaning;
    recPrice.textContent = result.price;
  }

  occasionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      occasionChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedOccasion = chip.getAttribute('data-occasion');
      updateRecommendation();
    });
  });

  vibeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      vibeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedVibe = chip.getAttribute('data-vibe');
      updateRecommendation();
    });
  });

  // Initial update
  updateRecommendation();
}

/* ==========================================================================
   5. Custom Bouquet Atelier Studio
   ========================================================================== */
function initCustomBouquetStudio() {
  const baseChips = document.querySelectorAll('.base-chip');
  const accentChips = document.querySelectorAll('.accent-chip');
  const wrapChips = document.querySelectorAll('.wrap-chip');

  const priceEl = document.getElementById('atelier-price');
  const tagsContainer = document.getElementById('recipe-tags');
  const customCtaBtn = document.getElementById('custom-cta-btn');

  if (!baseChips.length || !priceEl || !tagsContainer) return;

  let currentBase = { name: 'Blush Roses', price: 4300 };
  let currentAccent = { name: 'Sage Foliage', price: 400 };
  let currentWrap = { name: 'Dusty Rose Silk', price: 0 };

  function renderRecipe() {
    const total = currentBase.price + currentAccent.price + currentWrap.price;
    priceEl.textContent = `Rs. ${total.toLocaleString()}`;

    tagsContainer.innerHTML = `
      <span class="recipe-tag">🌸 ${currentBase.name}</span>
      <span class="recipe-tag">🌿 ${currentAccent.name}</span>
      <span class="recipe-tag">🎀 ${currentWrap.name}</span>
    `;

    if (customCtaBtn) {
      customCtaBtn.href = `Contact.html?inquiry=custom_bouquet&base=${encodeURIComponent(currentBase.name)}&accent=${encodeURIComponent(currentAccent.name)}&wrap=${encodeURIComponent(currentWrap.name)}`;
    }
  }

  baseChips.forEach(chip => {
    chip.addEventListener('click', () => {
      baseChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentBase = {
        name: chip.getAttribute('data-name'),
        price: parseInt(chip.getAttribute('data-price'), 10)
      };
      renderRecipe();
    });
  });

  accentChips.forEach(chip => {
    chip.addEventListener('click', () => {
      accentChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentAccent = {
        name: chip.getAttribute('data-name'),
        price: parseInt(chip.getAttribute('data-price'), 10)
      };
      renderRecipe();
    });
  });

  wrapChips.forEach(chip => {
    chip.addEventListener('click', () => {
      wrapChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentWrap = {
        name: chip.getAttribute('data-name'),
        price: parseInt(chip.getAttribute('data-price'), 10)
      };
      renderRecipe();
    });
  });

  // Initial render
  renderRecipe();
}

/* ==========================================================================
   6. Back to Top Button
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (!backToTopBtn) return;

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

