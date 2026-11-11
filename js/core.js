/**
 * Floral Delight - Core Architectural Module
 * Central Flower Catalog Data, LocalStorage Wishlist Engine,
 * Toast Notifications, and Global Navigation Handlers.
 */

/* ==========================================================================
   1. Central Flower Catalog (Single Source of Truth)
   ========================================================================== */
const FLORAL_CATALOG = [
  {
    id: 'tulip',
    name: 'Tulip Flower',
    tagline: 'Spring Velvet Bulbs',
    price: 5500,
    image: 'Images/Tulip.jpg',
    category: 'romance',
    occasions: ['wedding', 'anniversary', 'birthday', 'thanksgiving'],
    color: 'Blush Pink & Rose',
    meaning: 'Declaration of pure and enduring love, fresh beginnings, and deep affection.',
    season: 'Spring / All Year',
    stemLength: '45 cm',
    fragrance: 'Delicate & Sweet',
    description: 'Crisp, velvety Dutch tulips hand-selected for vibrant color and long-lasting freshness in your home or celebration.'
  },
  {
    id: 'rose',
    name: 'Rose Flower',
    tagline: 'Grand Velvet Petals',
    price: 4300,
    image: 'Images/rose.jpg',
    category: 'romance',
    occasions: ['wedding', 'anniversary', 'birthday', 'getwellsoon'],
    color: 'Crimson & Dusty Rose',
    meaning: 'Passionate romance, timeless beauty, profound devotion, and admiration.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Rich Classic Floral',
    description: 'Lush, classic garden roses with full velvety blooms and captivating natural aroma, hand-tied with custom silk ribbon.'
  },
  {
    id: 'lily',
    name: 'Lily Flower',
    tagline: 'Pure Majestic Petals',
    price: 4200,
    image: 'Images/Lily.jpg',
    category: 'serene',
    occasions: ['wedding', 'sympathy', 'getwellsoon', 'anniversary'],
    color: 'Ivory White & Blush',
    meaning: 'Purity of heart, rebirth, devotion, and tranquil peace.',
    season: 'All Year Harvest',
    stemLength: '60 cm',
    fragrance: 'Sweet & Intoxicating',
    description: 'Statuesque white lilies symbolizing serenity and refined honor, bringing a soothing presence to any room.'
  },
  {
    id: 'orchid',
    name: 'Orchid Flower',
    tagline: 'Exotic Phalaenopsis Stems',
    price: 5200,
    image: 'Images/Orchid.jpg',
    category: 'serene',
    occasions: ['wedding', 'anniversary', 'thanksgiving', 'corporate'],
    color: 'Porcelain White & Magenta',
    meaning: 'Refined elegance, rare luxury, spiritual strength, and thoughtful esteem.',
    season: 'All Year Harvest',
    stemLength: '55 cm',
    fragrance: 'Subtle & Clean',
    description: 'Sculptural Phalaenopsis stems boasting remarkable longevity and contemporary architectural poise.'
  },
  {
    id: 'anthurium',
    name: 'Anthurium Flower',
    tagline: 'Tropical Heart Silhouette',
    price: 4000,
    image: 'Images/Anthurium.jpg',
    category: 'vibrant',
    occasions: ['getwellsoon', 'birthday', 'thanksgiving', 'corporate'],
    color: 'Bold Coral & Pink',
    meaning: 'Warm hospitality, enduring friendship, resilience, and boundless abundance.',
    season: 'Tropical Year-Round',
    stemLength: '45 cm',
    fragrance: 'Mild Natural Green',
    description: 'Glossy heart-shaped exotic spathes that exude modern tropical warmth and unwavering longevity.'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    tagline: 'Sun-Kissed Petals',
    price: 4100,
    image: 'Images/Sunflower.jpg',
    category: 'vibrant',
    occasions: ['birthday', 'graduation', 'getwellsoon', 'thanksgiving'],
    color: 'Radiant Golden Yellow',
    meaning: 'Unwavering optimism, adoration, longevity, and vibrant joy.',
    season: 'Summer Harvest',
    stemLength: '50 cm',
    fragrance: 'Earthy Warmth',
    description: 'Vibrant, open-faced golden blooms radiating contagious happiness, warmth, and vitality.'
  },
  {
    id: 'carnation',
    name: 'Carnation Flower',
    tagline: 'Ruffled Garden Petals',
    price: 3800,
    image: 'Images/carnation.jpg',
    category: 'romance',
    occasions: ['mother', 'thanksgiving', 'birthday', 'anniversary'],
    color: 'Blush Pink & Peach',
    meaning: 'Deep gratitude, maternal love, affection, and steadfast devotion.',
    season: 'All Year Harvest',
    stemLength: '45 cm',
    fragrance: 'Clove & Spicy Sweet',
    description: 'Intricately ruffled petals that express profound thankfulness, sweetness, and enduring beauty.'
  },
  {
    id: 'daisy',
    name: 'Daisy Flower',
    tagline: 'Meadow Charm Stems',
    price: 4000,
    image: 'Images/daisy.jpg',
    category: 'vibrant',
    occasions: ['birthday', 'graduation', 'getwellsoon', 'friendship'],
    color: 'Crisp White & Butter Gold',
    meaning: 'Innocence, fresh beginnings, joyful cheer, and loyal companionship.',
    season: 'Spring to Autumn',
    stemLength: '40 cm',
    fragrance: 'Light Herbal Fresh',
    description: 'Sunny meadow daisies celebrating simple pleasures, candid smiles, and heartfelt friendships.'
  },
  {
    id: 'lotus',
    name: 'Lotus Flower',
    tagline: 'Sacred Blossom',
    price: 3800,
    image: 'Images/lotus.jpg',
    category: 'serene',
    occasions: ['sympathy', 'serenity', 'wedding', 'anniversary'],
    color: 'Tender Pink & White',
    meaning: 'Spiritual awakening, serenity, purity rising above hardship, and graceful resilience.',
    season: 'Seasonal Aquatic Harvest',
    stemLength: '35 cm',
    fragrance: 'Clean Aquatic Floral',
    description: 'Revered aquatic bloom representing inner peace, renewal, and timeless spiritual grace.'
  },
  {
    id: 'dahlias',
    name: 'Dahlias Flower',
    tagline: 'Intricate Geometric Petals',
    price: 4500,
    image: 'Images/Dahlias.jpeg',
    category: 'vibrant',
    occasions: ['anniversary', 'wedding', 'birthday', 'thanksgiving'],
    color: 'Burgundy & Soft Coral',
    meaning: 'Inner strength, dignity, graceful balance, and everlasting commitment.',
    season: 'Late Summer to Autumn',
    stemLength: '50 cm',
    fragrance: 'Soft Herbaceous',
    description: 'Hypnotic geometric symmetry of layered petals that capture admiration and refined artistic flair.'
  },
  {
    id: 'lavender',
    name: 'Lavender Flower',
    tagline: 'Aromatic French Stems',
    price: 4300,
    image: 'Images/Lavender.jpg',
    category: 'serene',
    occasions: ['getwellsoon', 'serenity', 'birthday', 'thanksgiving'],
    color: 'Soft Violet & Silver Sage',
    meaning: 'Calm spirit, quiet serenity, healing, and graceful tranquility.',
    season: 'All Year Harvest',
    stemLength: '40 cm',
    fragrance: 'Herbaceous & Calming Essential Oils',
    description: 'Aromatic sprigs that infuse living spaces with gentle soothing scent, available fresh or naturally dried.'
  },
  {
    id: 'all-in-one',
    name: 'All in one',
    tagline: 'Grand Masterpiece Arrangement',
    price: 6000,
    image: 'Images/all in one.jpg',
    category: 'romance',
    occasions: ['wedding', 'anniversary', 'graduation', 'birthday'],
    color: 'Harmonious Blush & Pastel Mix',
    meaning: 'The complete celebration of love, unity, abundance, and joyous milestones.',
    season: 'Curated Daily',
    stemLength: '60 cm',
    fragrance: 'Multi-Floral Symphony',
    description: 'Our premier signature composition combining roses, lilies, carnations, and rare foliage in a luxurious hand-tied arrangement.'
  }
];

/* Helper to get flower by ID */
function getFlowerById(id) {
  return FLORAL_CATALOG.find(f => f.id === id) || null;
}

/* ==========================================================================
   2. Smart Wishlist Management (LocalStorage)
   ========================================================================== */
const WISHLIST_STORAGE_KEY = 'floral_delight_wishlist';

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading wishlist from localStorage:', e);
    return [];
  }
}

function saveWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    updateWishlistNavBadge();
  } catch (e) {
    console.error('Error saving wishlist to localStorage:', e);
  }
}

function isWishlisted(flowerId) {
  const list = getWishlist();
  return list.includes(flowerId);
}

function toggleWishlist(flowerId) {
  let list = getWishlist();
  const flower = getFlowerById(flowerId);
  const flowerName = flower ? flower.name : 'Flower';
  let isNowAdded = false;

  if (list.includes(flowerId)) {
    list = list.filter(id => id !== flowerId);
    isNowAdded = false;
    showToast(`Removed ${flowerName} from Wishlist`, 'fa-heart-crack');
  } else {
    list.push(flowerId);
    isNowAdded = true;
    showToast(`Added ${flowerName} to Wishlist! 🌸`, 'fa-heart');
  }

  saveWishlist(list);
  updateWishlistButtons(flowerId, isNowAdded);
  return isNowAdded;
}

function updateWishlistNavBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.transform = 'scale(1.25)';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
    }, 200);
  });
}

function updateWishlistButtons(flowerId, isAdded) {
  document.querySelectorAll(`[data-wishlist-id="${flowerId}"]`).forEach(btn => {
    if (isAdded) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
      btn.setAttribute('aria-label', 'Remove from Wishlist');
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      btn.setAttribute('aria-label', 'Add to Wishlist');
    }
  });
}

/* ==========================================================================
   3. Toast Notification System
   ========================================================================== */
function showToast(message, iconClass = 'fa-circle-check') {
  let toast = document.querySelector('.floral-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'floral-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
  toast.classList.add('show');

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/* ==========================================================================
   4. Global Header, Navigation & Back-to-Top Handlers
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initBackToTop();
  updateWishlistNavBadge();

  // Cross-tab storage synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      updateWishlistNavBadge();
    }
  });
});

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

  mobileNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

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

