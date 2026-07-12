document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbarScroll();
  initScrollAnimations();
  initCookieConsent();
  initMobileMenu();
  initHistoryModals();
});

/**
 * 1. Dark/Light Theme Controller
 */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // Set initial theme
  setTheme(getPreferredTheme());

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

/**
 * 2. Sticky Navbar scroll behavior
 */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial load run
}

/**
 * 3. Mobile Navigation Drawer Toggle
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    toggleBtn.classList.toggle('active');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close drawer when clicking links
  const mobileLinks = drawer.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * 4. Scroll Reveal Animations (Intersection Observer)
 */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
  
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
  } else {
    animatedElements.forEach(el => el.classList.add('active'));
  }
}

/**
 * 5. Cookie Consent Banner
 */
function initCookieConsent() {
  const cookieBanner = document.getElementById('cookie-consent');
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');

  if (!cookieBanner) return;

  const consent = localStorage.getItem('cookie-consent');
  if (consent === null) {
    setTimeout(() => {
      cookieBanner.classList.add('show');
    }, 2000);
  }

  const hideBanner = (status) => {
    localStorage.setItem('cookie-consent', status);
    cookieBanner.classList.remove('show');
  };

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => hideBanner('accepted'));
  }
  if (declineBtn) {
    declineBtn.addEventListener('click', () => hideBanner('declined'));
  }
}

/**
 * 6. Game Heritage History Modal Controller
 */
function initHistoryModals() {
  const modal = document.getElementById('history-modal');
  const modalTitle = document.getElementById('modal-game-title');
  const modalDesc = document.getElementById('modal-game-desc');
  const modalHistory = document.getElementById('modal-game-history');
  const modalImg = document.getElementById('modal-game-img');
  const closeBtn = modal ? modal.querySelector('.modal-close-btn') : null;
  const overlay = modal ? modal.querySelector('.modal-overlay') : null;
  const buttons = document.querySelectorAll('.game-history-btn');

  if (!modal || !closeBtn || !overlay) return;

  const openModal = (btn) => {
    const name = btn.getAttribute('data-name');
    const desc = btn.getAttribute('data-description');
    const history = btn.getAttribute('data-history');
    const img = btn.getAttribute('data-image');

    modalTitle.textContent = name;
    modalDesc.textContent = desc;
    modalHistory.textContent = history;
    modalImg.src = img;
    modalImg.alt = `${name} Board Layout`;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => openModal(btn));
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}
