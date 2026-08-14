// Juliet Eron — site interactions
document.addEventListener('DOMContentLoaded', () => {

  // Opt into the reveal/thread animation system now that JS is confirmed running.
  // Content is fully visible by default in CSS; this class is what activates
  // the fade-in effect. If this script never runs at all, nothing stays hidden.
  document.documentElement.classList.add('js-anim');

  // Safety net, scheduled immediately and independent of everything below:
  // if any later code throws and never reaches the reveal/observer setup,
  // this still guarantees the page becomes fully visible shortly after load.
  setTimeout(() => {
    document.querySelectorAll('.reveal, .thread').forEach(el => el.classList.add('in'));
  }, 2500);

  try {
    initSite();
  } catch (err) {
    // A failure in one feature should never leave the rest of the page broken
    // or hidden — the safety net above already guarantees visible content.
    console.error('Juliet Eron site script error:', err);
  }
});

function initSite() {
  // Lucide icons
  if (window.lucide) lucide.createIcons();

  // Header solid state on scroll
  const header = document.querySelector('.site-header');
  const setHeader = () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('solid');
    else header.classList.remove('solid');
  };
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  // Mobile nav
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.nav-mobile');
  const closeX = document.querySelector('.nav-mobile .close-x');
  const openNav = () => { mobileNav.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeNav = () => { mobileNav.classList.remove('open'); document.body.style.overflow = ''; };
  if (toggle) toggle.addEventListener('click', openNav);
  if (closeX) closeX.addEventListener('click', closeNav);
  document.querySelectorAll('.nav-mobile-links a').forEach(a => a.addEventListener('click', closeNav));

  // Reveal + thread animations on scroll
  const animatable = document.querySelectorAll('.reveal, .thread');
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    animatable.forEach(el => io.observe(el));
  } else {
    // No IntersectionObserver support: skip the animation, show everything.
    animatable.forEach(el => el.classList.add('in'));
  }

  // Gentle parallax on the hero image (disabled for reduced-motion users)
  const heroMedia = document.querySelector('#hero-media');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroMedia && !prefersReducedMotion) {
    let ticking = false;
    const applyParallax = () => {
      const offset = Math.min(window.scrollY * 0.18, 140);
      heroMedia.style.transform = `translateY(${offset}px)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  // Consultation form (static demo — replace action with real endpoint)
  const consultForm = document.querySelector('#consultation-form');
  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = consultForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Request Sent';
      consultForm.querySelectorAll('input, select, textarea').forEach(f => f.disabled = true);
      setTimeout(() => {
        const note = document.querySelector('#consult-success');
        if (note) note.style.display = 'block';
      }, 300);
    });
  }

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Message Sent';
      contactForm.querySelectorAll('input, textarea').forEach(f => f.disabled = true);
    });
  }

  // ---------------------------------------------------------------------
  // Product detail modal (Shop Ready-to-Wear preview)
  // Reads data-* attributes from the clicked .product-card so this same
  // logic keeps working once cards are wired up to real Shopify products.
  const modal = document.querySelector('#product-modal');
  if (modal) {
    const modalImage = modal.querySelector('#modal-image');
    const modalCategory = modal.querySelector('#modal-category');
    const modalTitle = modal.querySelector('#modal-title');
    const modalPrice = modal.querySelector('#modal-price');
    const modalDesc = modal.querySelector('#modal-desc');
    const modalSizes = modal.querySelector('#modal-sizes');
    const modalColorsRow = modal.querySelector('#modal-colors-row');
    const modalColors = modal.querySelector('#modal-colors');
    const modalFabric = modal.querySelector('#modal-fabric');
    const modalDelivery = modal.querySelector('#modal-delivery');
    const modalWhatsapp = modal.querySelector('#modal-whatsapp');

    const openModal = (card) => {
      const d = card.dataset;
      modalImage.src = d.image;
      modalImage.alt = d.alt || d.name;
      modalCategory.textContent = d.category;
      modalTitle.textContent = d.name;
      modalPrice.textContent = d.price ? `R${d.price}` : 'Price available soon';
      modalPrice.className = d.price ? 'product-modal-price' : 'product-modal-price is-tbc';
      modalDesc.textContent = d.description;
      modalFabric.textContent = d.fabric;
      modalDelivery.textContent = d.delivery;

      modalSizes.innerHTML = '';
      (d.sizes ? d.sizes.split(',') : []).forEach((size, i) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'size-pill' + (i === 0 ? ' active' : '');
        pill.textContent = size;
        pill.addEventListener('click', () => {
          modalSizes.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        });
        modalSizes.appendChild(pill);
      });

      const colors = d.colors ? d.colors.split(',').filter(Boolean) : [];
      if (colors.length) {
        modalColorsRow.style.display = '';
        modalColors.innerHTML = '';
        colors.forEach(c => {
          const sw = document.createElement('span');
          sw.className = 'color-swatch';
          sw.style.background = c;
          modalColors.appendChild(sw);
        });
      } else {
        modalColorsRow.style.display = 'none';
      }

      const waText = encodeURIComponent(`Hi Juliet Eron, I'd like to find out more about the ${d.name}.`);
      modalWhatsapp.href = modalWhatsapp.href.split('?')[0] + `?text=${waText}`;

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (window.lucide) lucide.createIcons();
    };

    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.product-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        if (card) openModal(card);
      });
    });

    modal.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

}
