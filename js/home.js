/**
 * Floral Delight - Homepage Interactive Experience
 * Handles navigation, interactive filters, recommendation finder,
 * and custom bouquet atelier studio.
 */

document.addEventListener('DOMContentLoaded', () => {
  initFloralOpeningExperience();
  initHeroVideoBackground();
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
   7. Full-Screen Continuous Floral Petal Falling Experience
   ========================================================================== */
function initFloralOpeningExperience() {
  const petalsField = document.getElementById('screen-petals-field');
  const replayBtn = document.getElementById('replay-entrance-btn');
  if (!petalsField) return;

  // Petal botanical color gradients (Ruby Anthurium, Velvet Rose, Soft Blush, Sage Leaf)
  const PETAL_TYPES = [
    {
      color: '#C92A3E',
      gradient: ['#FF6B7D', '#C92A3E', '#801020'],
      type: 'petal-anthurium'
    },
    {
      color: '#E8C5C4',
      gradient: ['#FFF2F1', '#E8C5C4', '#B9828C'],
      type: 'petal-rose'
    },
    {
      color: '#B9828C',
      gradient: ['#F7E9E8', '#DCA9A8', '#9E646F'],
      type: 'petal-velvet'
    },
    {
      color: '#F4D2CE',
      gradient: ['#FFFFFF', '#F4D2CE', '#D29D9B'],
      type: 'petal-blush'
    },
    {
      color: '#899982',
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

  // Generate continuous falling petals across the full screen (0vw to 100vw)
  function initFullScreenPetals() {
    petalsField.innerHTML = '';
    const isMobile = window.innerWidth < 768;
    const petalCount = isMobile ? 14 : 24;

    for (let i = 0; i < petalCount; i++) {
      const petalEl = document.createElement('div');
      petalEl.className = 'screen-petal-item';
      const config = PETAL_TYPES[i % PETAL_TYPES.length];
      const uniqueId = `fs-petal-${i}`;
      petalEl.innerHTML = createPetalSVG(config, uniqueId);

      const size = isMobile ? (16 + Math.random() * 16) : (20 + Math.random() * 22);
      petalEl.style.width = `${size}px`;
      petalEl.style.height = `${size * 1.25}px`;

      const startLeft = Math.random() * 100;
      const duration = 10 + Math.random() * 9; // 10s - 19s
      const delay = -Math.random() * duration; // Negative delay so screen is already full of petals on load
      const sway = (Math.random() - 0.5) * 80;
      const opacity = 0.75 + Math.random() * 0.22;

      petalEl.style.left = `${startLeft}%`;
      petalEl.style.setProperty('--sway-x', `${sway}px`);
      petalEl.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 30}px`);
      petalEl.style.setProperty('--petal-opacity', `${opacity}`);
      petalEl.style.animationDuration = `${duration}s`;
      petalEl.style.animationDelay = `${delay}s`;

      petalsField.appendChild(petalEl);
    }
  }

  // Trigger playful flourish wave when user clicks Replay button
  function triggerPetalFlourish() {
    const flourishCount = window.innerWidth < 768 ? 12 : 20;
    for (let i = 0; i < flourishCount; i++) {
      const p = document.createElement('div');
      p.className = 'flourish-petal-item';
      const config = PETAL_TYPES[i % PETAL_TYPES.length];
      p.innerHTML = createPetalSVG(config, `flourish-${Date.now()}-${i}`);

      const size = 18 + Math.random() * 24;
      p.style.width = `${size}px`;
      p.style.height = `${size * 1.25}px`;

      const startX = Math.random() * window.innerWidth;
      const startY = -40;
      const duration = 4.5 + Math.random() * 3.5;
      const targetX = startX + (Math.random() - 0.5) * 220;
      const targetY = window.innerHeight + 60;
      const rot = (Math.random() - 0.5) * 720;

      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.opacity = '0';
      p.style.transform = 'translate3d(0, 0, 0) scale(0.4)';
      petalsField.appendChild(p);

      setTimeout(() => {
        p.style.transition = `transform ${duration}s cubic-bezier(0.18, 0.82, 0.35, 1), opacity 0.6s ease`;
        p.style.opacity = '0.9';
        p.style.transform = `translate3d(${targetX - startX}px, ${targetY - startY}px, 0) rotate(${rot}deg) scale(1)`;

        setTimeout(() => {
          p.style.transition = 'opacity 1.2s ease';
          p.style.opacity = '0';
          setTimeout(() => {
            if (p.parentNode) p.parentNode.removeChild(p);
          }, 1200);
        }, (duration - 1.2) * 1000);
      }, 20);
    }
  }

  initFullScreenPetals();

  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerPetalFlourish();
    });
  }
}

/* ==========================================================================
   8. HD Rose-Falling Background Video Controller (Seamless Loop Mode)
   ========================================================================== */
function initHeroVideoBackground() {
  const video = document.getElementById('hero-bg-video');
  const replayBtn = document.getElementById('replay-entrance-btn');
  if (!video) return;

  // Enforce muted and playsinline to satisfy mobile and modern browser autoplay policies
  video.muted = true;
  video.playsInline = true;
  video.loop = true; // Loop mode enabled

  // Autoplay automatically when visitors open the website
  const startAutoplay = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback: If autoplay was prevented by strict browser gesture rules, play on first user interaction
        const triggerPlay = () => {
          video.play().catch(() => {});
          window.removeEventListener('click', triggerPlay);
          window.removeEventListener('touchstart', triggerPlay);
          window.removeEventListener('scroll', triggerPlay);
        };
        window.addEventListener('click', triggerPlay, { once: true, passive: true });
        window.addEventListener('touchstart', triggerPlay, { once: true, passive: true });
        window.addEventListener('scroll', triggerPlay, { once: true, passive: true });
      });
    }
  };

  startAutoplay();

  // Synchronize Replay Floral Falling Experience button
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      try {
        video.currentTime = 0;
        video.play().catch(() => {});
      } catch (err) {
        // Catch any seek or play exceptions
      }
    });
  }
}


