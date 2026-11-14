/**
 * Floral Delight - Homepage Interactive Experience
 * Handles navigation, interactive filters, recommendation finder,
 * and custom bouquet atelier studio.
 */

document.addEventListener('DOMContentLoaded', () => {
  initFloralOpeningExperience();
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

/* ==========================================================================
   7. Standalone 3D Falling Floral Bouquet & Flying Petals Experience
   ========================================================================== */
function initFloralOpeningExperience() {
  const bouquetContainer = document.getElementById('hero-3d-bouquet-container');
  const bouquetAssembly = document.getElementById('bouquet-3d-assembly');
  const petalsField = document.getElementById('screen-petals-field');
  const ambientLayer = document.getElementById('ambient-living-petals');
  const replayBtn = document.getElementById('replay-entrance-btn');
  const heroVisual = document.querySelector('.hero-visual');

  // Petal SVG shapes & botanical palettes (Blush, Dusty Rose, Sage leaf)
  const PETAL_TYPES = [
    {
      color: '#E8C5C4', // Soft Blush
      gradient: ['#FFF2F1', '#E8C5C4', '#B9828C'],
      type: 'petal-rose'
    },
    {
      color: '#B9828C', // Dusty Rose
      gradient: ['#F7E9E8', '#DCA9A8', '#9E646F'],
      type: 'petal-velvet'
    },
    {
      color: '#F4D2CE', // Tender Peach Blush
      gradient: ['#FFFFFF', '#F4D2CE', '#D29D9B'],
      type: 'petal-blush'
    },
    {
      color: '#899982', // Sage Green Leaf Accent
      gradient: ['#DCE3DA', '#899982', '#6C7D65'],
      type: 'leaf-sage'
    }
  ];

  function createPetalSVG(petalConfig, uniqueId) {
    const isLeaf = petalConfig.type === 'leaf-sage';
    const gradId = `petal-grad-${uniqueId}`;
    const [c1, c2, c3] = petalConfig.gradient;

    if (isLeaf) {
      return `
        <svg viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${c1}" />
              <stop offset="60%" stop-color="${c2}" />
              <stop offset="100%" stop-color="${c3}" />
            </linearGradient>
          </defs>
          <path d="M 20,2 C 34,12 38,38 20,58 C 2,38 6,12 20,2 Z" fill="url(#${gradId})" />
          <path d="M 20,6 Q 20,32 20,54" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 50 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${gradId}" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${c1}" stop-opacity="0.95" />
            <stop offset="65%" stop-color="${c2}" stop-opacity="0.92" />
            <stop offset="100%" stop-color="${c3}" stop-opacity="0.90" />
          </radialGradient>
        </defs>
        <path d="M 25,0 C 42,4 50,22 47,38 C 43,52 30,58 25,60 C 20,58 7,52 3,38 C 0,22 8,4 25,0 Z" fill="url(#${gradId})" />
        <path d="M 25,8 Q 24,30 25,52" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
      </svg>
    `;
  }

  // Always initialize background ambient petals (living botanical movement)
  initAmbientPetals();

  if (!bouquetContainer) return;

  // Setup interactive 3D perspective mouse parallax on the standalone bouquet
  init3DParallax();

  function playFallingBouquetAndPetals() {
    // Reset state for clean animation trigger
    bouquetContainer.classList.remove('bouquet-landed');
    if (petalsField) petalsField.innerHTML = '';

    // Step 1: Bouquet descends gently from top of screen directly onto home screen hero
    setTimeout(() => {
      bouquetContainer.classList.add('bouquet-landed');
    }, 120);

    // Step 2: As the bouquet falls, flower petals separate and fly around screen
    setTimeout(() => {
      spawnFlyingPetals(38);
    }, 450);
  }

  function spawnFlyingPetals(count) {
    if (!petalsField) return;

    // Calculate approximate origin from the descending bouquet
    const rect = bouquetContainer.getBoundingClientRect();
    const originX = rect.left > 0 ? (rect.left + rect.width / 2) : (window.innerWidth * 0.72);
    const originY = Math.max(60, rect.top + rect.height * 0.35);

    for (let i = 0; i < count; i++) {
      const petalEl = document.createElement('div');
      petalEl.className = 'flying-petal-item';
      const config = PETAL_TYPES[i % PETAL_TYPES.length];
      const uniqueId = `fly-${i}-${Date.now()}`;
      petalEl.innerHTML = createPetalSVG(config, uniqueId);

      const size = 20 + Math.random() * 26; // 20px - 46px
      petalEl.style.width = `${size}px`;
      petalEl.style.height = `${size * 1.25}px`;

      // Start origin at bouquet center
      const startX = originX + (Math.random() - 0.5) * 120;
      const startY = originY + (Math.random() - 0.5) * 100;

      // Realistic botanical flight dynamics
      const angle = (Math.PI * 2 * (i / count)) + (Math.random() - 0.5) * 0.6;
      const distance = 160 + Math.random() * (Math.max(window.innerWidth, window.innerHeight) * 0.62);
      const targetX = startX + Math.cos(angle) * distance;
      // Gentle downward gravity drift
      const targetY = startY + Math.sin(angle) * (distance * 0.65) + (160 + Math.random() * 260);

      const rotX = (Math.random() - 0.5) * 720;
      const rotY = (Math.random() - 0.5) * 720;
      const rotZ = (Math.random() - 0.5) * 720;
      const duration = 2.4 + Math.random() * 1.8; // 2.4s - 4.2s
      const delay = Math.random() * 0.5;

      petalEl.style.left = `${startX}px`;
      petalEl.style.top = `${startY}px`;
      petalEl.style.opacity = '0';
      petalEl.style.transform = `translate3d(0, 0, 0) scale(0.35) rotate(0deg)`;

      petalsField.appendChild(petalEl);

      // Trigger physics motion
      setTimeout(() => {
        petalEl.style.transition = `
          transform ${duration}s cubic-bezier(0.12, 0.82, 0.35, 1) ${delay}s,
          opacity ${duration}s ease ${delay}s
        `;
        petalEl.style.opacity = `${0.75 + Math.random() * 0.25}`;
        petalEl.style.transform = `
          translate3d(${targetX - startX}px, ${targetY - startY}px, 0)
          rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)
          scale(${0.85 + Math.random() * 0.35})
        `;

        // Smoothly fade out at end of flight
        setTimeout(() => {
          petalEl.style.transition = 'opacity 1.2s ease';
          petalEl.style.opacity = '0';
          setTimeout(() => {
            if (petalEl.parentNode) petalEl.parentNode.removeChild(petalEl);
          }, 1200);
        }, (duration + delay) * 1000 - 800);
      }, 20);
    }
  }

  // Interactive 3D Perspective Tilt on Mouse Movement
  function init3DParallax() {
    if (!heroVisual || !bouquetAssembly) return;

    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      bouquetAssembly.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg) translateZ(12px)`;
    });

    heroVisual.addEventListener('mouseleave', () => {
      bouquetAssembly.style.transform = '';
    });
  }

  // Ambient living background petals (Evergreen Subtle Motion on Hero)
  function initAmbientPetals() {
    if (!ambientLayer) return;
    ambientLayer.innerHTML = '';
    const petalCount = window.innerWidth < 768 ? 6 : 10;

    for (let i = 0; i < petalCount; i++) {
      const p = document.createElement('div');
      p.className = 'ambient-petal';
      const config = PETAL_TYPES[i % PETAL_TYPES.length];
      const uniqueId = `amb-${i}`;
      p.innerHTML = createPetalSVG(config, uniqueId);

      const size = 16 + Math.random() * 18;
      p.style.width = `${size}px`;
      p.style.height = `${size * 1.2}px`;

      const startLeft = Math.random() * 100;
      const startTop = -10 - Math.random() * 30;
      const duration = 12 + Math.random() * 10;
      const delay = Math.random() * 12;

      p.style.left = `${startLeft}%`;
      p.style.top = `${startTop}%`;
      p.style.animation = `ambientFloat ${duration}s linear infinite ${delay}s`;

      ambientLayer.appendChild(p);
    }
  }

  // Replay entrance button listener
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      bouquetContainer.classList.remove('bouquet-landed');
      setTimeout(() => {
        playFallingBouquetAndPetals();
      }, 200);
    });
  }

  // Run the entrance animation on homepage load
  playFallingBouquetAndPetals();
}

