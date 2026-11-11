/**
 * Floral Delight - Customer Reviews Controller
 * Manages sample reviews, interactive star ratings, photo upload handling,
 * and LocalStorage persistence with clear demonstration transparency.
 */

document.addEventListener('DOMContentLoaded', () => {
  initReviewsPage();
});

const REVIEWS_STORAGE_KEY = 'floral_customer_reviews';

// Curated sample demonstration reviews (clearly marked)
const SAMPLE_REVIEWS = [
  {
    id: 'sample-1',
    name: 'Dilhara Senanayake',
    occasion: 'Wedding Anniversary',
    rating: 5,
    date: 'October 2024',
    text: 'The Velvet Roses and French Lavender combination for our anniversary was breathtaking. The stems stayed radiant for over a week, and the handwritten calligraphy note added such a graceful personal touch.',
    photo: 'Images/rose.jpg',
    isSample: true
  },
  {
    id: 'sample-2',
    name: 'Rashmi Perera',
    occasion: 'Birthday Surprise',
    rating: 5,
    date: 'September 2024',
    text: 'I used the Custom Bouquet Builder to combine Sunflowers and Dutch Tulips with Sage Kraft wrapping. My sister was thrilled! The live price calculation was completely accurate and delivery across Colombo was prompt.',
    photo: 'Images/Sunflower.jpg',
    isSample: true
  },
  {
    id: 'sample-3',
    name: 'Kavinda Jayawardena',
    occasion: 'Graduation Celebration',
    rating: 5,
    date: 'August 2024',
    text: 'The All-in-One grand arrangement was the highlight of our family celebration. You can truly tell these flowers are harvested with intent from local growers. Outstanding craft.',
    photo: 'Images/all in one.jpg',
    isSample: true
  },
  {
    id: 'sample-4',
    name: 'Nadeesha Fernando',
    occasion: 'Mother’s Day Tribute',
    rating: 5,
    date: 'May 2024',
    text: 'The ruffled Carnations in soft blush silk wrap conveyed the heartfelt thankfulness I wanted to express. Floral Delight has been our go-to atelier since their early days in 2018.',
    photo: 'Images/carnation.jpg',
    isSample: true
  }
];

let selectedRating = 5;
let uploadedPhotoBase64 = null;

function initReviewsPage() {
  renderReviewsList();
  setupStarPicker();
  setupPhotoUpload();
  setupReviewForm();
}

function getStoredReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredReviews(reviews) {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error(e);
  }
}

function renderReviewsList() {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  const userReviews = getStoredReviews();
  const allReviews = [...userReviews, ...SAMPLE_REVIEWS];

  container.innerHTML = allReviews.map(rev => {
    const stars = Array(5).fill(0).map((_, i) => 
      `<i class="${i < rev.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
    ).join('');

    const badgeHtml = rev.isSample
      ? `<span class="review-sample-badge"><i class="fa-solid fa-flask"></i> Sample Demonstration Review</span>`
      : `<span class="review-sample-badge review-user-badge"><i class="fa-solid fa-circle-check"></i> Verified Client • Stored in Browser</span>`;

    const photoHtml = rev.photo 
      ? `<div class="review-photo-wrap"><img src="${rev.photo}" alt="Arrangement photo from ${rev.name}"></div>` 
      : '';

    return `
      <article class="review-card">
        <div class="review-card-header">
          <div class="stars-row" style="font-size: 1rem; margin-bottom: 0;">${stars}</div>
          ${badgeHtml}
        </div>

        <p class="review-text">"${rev.text}"</p>
        ${photoHtml}

        <div class="review-author-info">
          <div class="author-avatar">${rev.name.charAt(0)}</div>
          <div class="author-meta">
            <h4>${rev.name}</h4>
            <span>${rev.occasion} • ${rev.date}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function setupStarPicker() {
  const starsWrap = document.getElementById('rating-star-picker');
  if (!starsWrap) return;

  const stars = starsWrap.querySelectorAll('i');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-star'), 10);
      updateStarDisplay(stars, selectedRating);
    });

    star.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(star.getAttribute('data-star'), 10);
      updateStarDisplay(stars, hoverVal);
    });
  });

  starsWrap.addEventListener('mouseleave', () => {
    updateStarDisplay(stars, selectedRating);
  });
}

function updateStarDisplay(stars, rating) {
  stars.forEach((s, idx) => {
    if (idx < rating) {
      s.className = 'fa-solid fa-star';
    } else {
      s.className = 'fa-regular fa-star';
    }
  });
}

function setupPhotoUpload() {
  const fileInput = document.getElementById('review-photo-input');
  const previewBox = document.getElementById('photo-preview-box');

  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      uploadedPhotoBase64 = null;
      if (previewBox) previewBox.innerHTML = '';
      return;
    }

    // Check size limit (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size exceeds 2MB limit. Please choose a smaller photo.');
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedPhotoBase64 = event.target.result;
      if (previewBox) {
        previewBox.innerHTML = `
          <div style="position: relative; display: inline-block; margin-top: 10px;">
            <img src="${uploadedPhotoBase64}" alt="Upload preview" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-subtle);">
            <button type="button" onclick="removeUploadedPhoto()" style="position: absolute; top: -6px; right: -6px; background: red; color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; cursor: pointer;">✕</button>
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeUploadedPhoto() {
  uploadedPhotoBase64 = null;
  const fileInput = document.getElementById('review-photo-input');
  const previewBox = document.getElementById('photo-preview-box');
  if (fileInput) fileInput.value = '';
  if (previewBox) previewBox.innerHTML = '';
}

function setupReviewForm() {
  const form = document.getElementById('customer-review-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('review-name');
    const occInput = document.getElementById('review-occasion');
    const textInput = document.getElementById('review-text');

    const name = nameInput.value.trim();
    const occasion = occInput.value;
    const text = textInput.value.trim();

    if (!name || !text) {
      alert('Please fill in your name and review message.');
      return;
    }

    const newReview = {
      id: 'user-' + Date.now(),
      name,
      occasion,
      rating: selectedRating,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      text,
      photo: uploadedPhotoBase64,
      isSample: false
    };

    const currentStored = getStoredReviews();
    currentStored.unshift(newReview);
    saveStoredReviews(currentStored);

    renderReviewsList();
    form.reset();
    removeUploadedPhoto();
    selectedRating = 5;
    updateStarDisplay(document.querySelectorAll('#rating-star-picker i'), 5);

    showToast('Thank you! Your review has been saved in your browser. 🌸', 'fa-heart');
    
    // Smooth scroll back to reviews
    const feed = document.getElementById('reviews-anchor');
    if (feed) feed.scrollIntoView({ behavior: 'smooth' });
  });
}

