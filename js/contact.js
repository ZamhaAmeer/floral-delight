/**
 * Floral Delight - Contact & Atelier Inquiries Controller (Enhanced)
 * Supports occasion chips, inquiry auto-filling, accordion FAQ,
 * and client-side confirmation feedback.
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactPage();
});

const CONTACT_STORAGE_KEY = 'floral_contact_messages';
let selectedOccasionChip = 'Birthday Celebration';

function initContactPage() {
  setupOccasionChips();
  handleUrlQueryParams();
  setupFaqAccordion();
  setupContactForm();
}

/* Occasion Chip Picker */
function setupOccasionChips() {
  const chips = document.querySelectorAll('.form-chip-btn');
  const hiddenInput = document.getElementById('selected-occasion-input');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedOccasionChip = chip.getAttribute('data-occasion');
      if (hiddenInput) hiddenInput.value = selectedOccasionChip;
    });
  });
}

/* Auto-fill from Bouquet Builder or Shop URL parameters */
function handleUrlQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const inquiryType = params.get('inquiry');
  const typeSelect = document.getElementById('contact-type');
  const messageArea = document.getElementById('contact-message');

  if (!messageArea) return;

  if (inquiryType === 'custom_bouquet') {
    if (typeSelect) typeSelect.value = 'Custom Bouquet Order';
    const stems = params.get('stems') || 'Custom floral arrangement';
    const wrap = params.get('wrap') || 'Artisan Paper';
    const ribbon = params.get('ribbon') || 'Satin Ribbon';
    const total = params.get('total') || '';

    messageArea.value = `Hello Floral Delight Atelier,\n\nI would like to order the custom bouquet I composed in your online studio:\n• Stems: ${stems}\n• Packaging: ${wrap}\n• Ribbon: ${ribbon}\n• Estimated Total: ${total}\n\nPlease confirm availability and delivery to my location in Colombo. Thank you!`;

    // Auto-scroll to form smoothly
    const formSection = document.getElementById('stationery-form-anchor');
    if (formSection) {
      setTimeout(() => {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }

    showToast('Custom bouquet recipe auto-loaded into inquiry! 🌸', 'fa-wand-magic-sparkles');
  } else if (inquiryType === 'order') {
    if (typeSelect) typeSelect.value = 'Specific Flower Order';
    const product = params.get('product') || 'Flower Bouquet';
    const price = params.get('price') ? ` (Rs. ${parseInt(params.get('price')).toLocaleString()})` : '';

    messageArea.value = `Hello Floral Delight Atelier,\n\nI would like to place an order for the ${product}${price}.\n\nPlease let me know the soonest available delivery or studio pickup time. Thank you!`;

    const formSection = document.getElementById('stationery-form-anchor');
    if (formSection) {
      setTimeout(() => {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }

    showToast(`Inquiry for ${product} loaded! 🌸`, 'fa-circle-check');
  }
}

/* FAQ Accordion Toggle */
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.contact-faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-header-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close other items
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* Form submission handling */
function setupContactForm() {
  const form = document.getElementById('atelier-contact-form');
  const formCard = document.querySelector('.stationery-form-card');
  if (!form || !formCard) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const inquiryType = document.getElementById('contact-type').value;
    const budget = document.getElementById('contact-budget').value;
    const replyMethod = document.querySelector('input[name="reply_method"]:checked')?.value || 'Email';
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      alert('Please fill in your name, email, and message.');
      return;
    }

    const newInquiry = {
      id: 'inquiry-' + Date.now(),
      name,
      email,
      phone: phone || 'Not provided',
      inquiryType,
      occasion: selectedOccasionChip,
      budget,
      replyMethod,
      message,
      submittedAt: new Date().toLocaleString()
    };

    // Save in LocalStorage
    try {
      const existing = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
      existing.unshift(newInquiry);
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.error(err);
    }

    // Replace form with confirmation card
    formCard.innerHTML = `
      <div class="stationery-success-card">
        <i class="fa-solid fa-circle-check success-main-icon"></i>
        <h3>Thank You, ${name}!</h3>
        <p>
          Your floral inquiry regarding <strong>"${inquiryType}"</strong> has been safely recorded by our atelier. Our florists will prepare a personalized response and reach out via <strong>${replyMethod}</strong> (${replyMethod === 'Phone' || replyMethod === 'WhatsApp' ? phone : email}) shortly.
        </p>

        <div class="success-details-receipt">
          <strong style="display: block; margin-bottom: 8px; color: var(--dark-charcoal); font-size: 1rem;">
            <i class="fa-solid fa-receipt"></i> Inquiry Consultation Details:
          </strong>
          <div><strong>Occasion:</strong> ${selectedOccasionChip}</div>
          <div><strong>Inquiry Subject:</strong> ${inquiryType}</div>
          <div><strong>Preferred Channel:</strong> ${replyMethod}</div>
          <div><strong>Submission Time:</strong> ${newInquiry.submittedAt}</div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-subtle); font-style: italic; color: var(--dark-charcoal-muted);">
            "${message.substring(0, 140)}${message.length > 140 ? '...' : ''}"
          </div>
        </div>

        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <a href="Products.html" class="btn btn-primary">
            <i class="fa-solid fa-bag-shopping"></i> Explore Curated Flowers
          </a>
          <button type="button" class="btn btn-outline" onclick="window.location.reload()">
            <i class="fa-solid fa-pen"></i> Submit Another Message
          </button>
        </div>
      </div>
    `;

    showToast('Your message has been sent to our atelier! 🌸', 'fa-envelope-circle-check');
  });
}
