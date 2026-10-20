document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbarScroll();
  initScrollAnimations();
  initCookieConsent();
  initMobileMenu();
  initHistoryModals();
  initBoardShowcases();
  initHeroCarousel();
  initCollectionFiltering();
  initNavSearch();
  initGameTabs();
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
    return 'dark'; // Default to deep charcoal dark theme matching reference
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

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
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
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.05
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
 * 6. Game Heritage History & Rules Modal Controller
 */
function initHistoryModals() {
  const modal = document.getElementById('history-modal');
  const modalTitle = document.getElementById('modal-game-title');
  const modalDesc = document.getElementById('modal-game-desc');
  const modalHistory = document.getElementById('modal-game-history');
  const modalRules = document.getElementById('modal-game-rules');
  const modalImg = document.getElementById('modal-game-img');
  const modalPlayCtaBox = document.getElementById('modal-play-cta-box');
  const modalPlayLink = document.getElementById('modal-play-link');
  const closeBtn = modal ? modal.querySelector('.modal-close-btn') : null;
  const overlay = modal ? modal.querySelector('.modal-overlay') : null;
  const buttons = document.querySelectorAll('.game-history-btn');

  if (!modal || !closeBtn || !overlay) return;

  const openModal = (btn) => {
    const name = btn.getAttribute('data-name');
    const desc = btn.getAttribute('data-description');
    const history = btn.getAttribute('data-history');
    const rules = btn.getAttribute('data-rules');
    const img = btn.getAttribute('data-image');
    const status = btn.getAttribute('data-status');
    const playUrl = btn.getAttribute('data-playurl');

    if (modalTitle) modalTitle.textContent = name;
    if (modalDesc) modalDesc.textContent = desc;
    if (modalHistory) modalHistory.textContent = history;
    if (modalRules) modalRules.textContent = rules || 'Traditional rules passed through oral and regional tournament traditions.';
    if (modalImg) {
      modalImg.src = img;
      modalImg.alt = `${name} Board Layout`;
    }

    if (modalPlayCtaBox && modalPlayLink) {
      if (status === 'playable' && playUrl) {
        modalPlayLink.href = playUrl;
        modalPlayLink.textContent = `Play ${name} in 3D`;
        modalPlayCtaBox.style.display = 'block';
      } else {
        modalPlayCtaBox.style.display = 'none';
      }
    }

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

/**
 * 7. Initialize 3D Board Showcase Components with IntersectionObserver Lazy Loading
 */
function initBoardShowcases() {
  if (!window.createBoardShowcase) return;

  const showcases = document.querySelectorAll('.game-board-showcase[data-board-type]');
  if (showcases.length === 0) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const boardType = el.getAttribute('data-board-type');
          
          window.createBoardShowcase(el, boardType, { size: 280 });

          if (window.createTilt) {
            const maxTilt = parseFloat(el.getAttribute('data-tilt-max')) || 14;
            window.createTilt(el, { maxTiltX: maxTilt, maxTiltY: maxTilt, scale: 1.03 });
          }

          observer.unobserve(el);
        }
      });
    }, { rootMargin: '150px 0px 150px 0px', threshold: 0.05 });

    showcases.forEach(el => observer.observe(el));
  } else {
    showcases.forEach(el => {
      const boardType = el.getAttribute('data-board-type');
      window.createBoardShowcase(el, boardType, { size: 280 });
      if (window.createTilt) {
        const maxTilt = parseFloat(el.getAttribute('data-tilt-max')) || 14;
        window.createTilt(el, { maxTiltX: maxTilt, maxTiltY: maxTilt, scale: 1.03 });
      }
    });
  }
}

/**
 * 8. Cinematic Hero Carousel (Pachisi <-> Bagh Bakri)
 */
function initHeroCarousel() {
  const container = document.getElementById('hero-carousel-container');
  if (!container) return;

  const slides = container.querySelectorAll('.hero-carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');

  if (slides.length <= 1) return;

  let currentIdx = 0;

  function showSlide(idx) {
    if (idx < 0) idx = slides.length - 1;
    if (idx >= slides.length) idx = 0;
    currentIdx = idx;

    slides.forEach((slide, i) => {
      if (i === currentIdx) {
        slide.style.display = 'block';
        setTimeout(() => slide.classList.add('active'), 20);
      } else {
        slide.classList.remove('active');
        slide.style.display = 'none';
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIdx);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => showSlide(currentIdx - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => showSlide(currentIdx + 1));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-slide'), 10);
      if (!isNaN(idx)) showSlide(idx);
    });
  });
}

/**
 * 9. Explore the Collection — Real-Time Search & Multi-Criteria Filtering
 */
function initCollectionFiltering() {
  const searchInput = document.getElementById('catalogue-search-input');
  const categorySelect = document.getElementById('filter-category');
  const playersSelect = document.getElementById('filter-players');
  const diffSelect = document.getElementById('filter-difficulty');
  const availSelect = document.getElementById('filter-availability');
  const clearBtn = document.getElementById('clear-all-filters-btn');
  const resetBtn = document.getElementById('reset-collection-filters-btn');
  const cards = document.querySelectorAll('.discovery-card');
  const emptyState = document.getElementById('collection-empty-state');
  const collectionBanners = document.querySelectorAll('.collection-card');

  if (!cards.length) return;

  // Check URL parameters for preset category (e.g., ?category=indian-heritage)
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  if (paramCategory && categorySelect) {
    categorySelect.value = paramCategory;
    highlightCollectionCard(paramCategory);
  }

  function highlightCollectionCard(cat) {
    collectionBanners.forEach(banner => {
      const filter = banner.getAttribute('data-collection-filter');
      banner.classList.toggle('active', filter === cat);
    });
  }

  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = categorySelect ? categorySelect.value : 'all';
    const selectedPlayers = playersSelect ? playersSelect.value : 'all';
    const selectedDiff = diffSelect ? diffSelect.value : 'all';
    const selectedAvail = availSelect ? availSelect.value : 'all';

    let matchCount = 0;

    cards.forEach(card => {
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const regional = (card.getAttribute('data-regional') || '').toLowerCase();
      const category = card.getAttribute('data-category') || '';
      const players = card.getAttribute('data-players') || '';
      const diff = card.getAttribute('data-difficulty') || '';
      const status = card.getAttribute('data-status') || '';

      // Search match
      const matchesSearch = !query || name.includes(query) || regional.includes(query);

      // Category match
      let matchesCat = (selectedCat === 'all');
      if (!matchesCat) {
        if (selectedCat === 'board-of-mills') {
          matchesCat = (category === 'board-of-mills' || card.getAttribute('data-name') === "nine men's morris");
        } else {
          matchesCat = (category === selectedCat);
        }
      }

      // Players match
      let matchesPlayers = (selectedPlayers === 'all');
      if (!matchesPlayers) {
        matchesPlayers = (players === selectedPlayers || players.includes(selectedPlayers));
      }

      // Difficulty match
      const matchesDiff = (selectedDiff === 'all') || (diff.toLowerCase() === selectedDiff.toLowerCase());

      // Availability match
      const matchesAvail = (selectedAvail === 'all') || (status === selectedAvail);

      if (matchesSearch && matchesCat && matchesPlayers && matchesDiff && matchesAvail) {
        card.style.display = 'flex';
        matchCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = matchCount === 0 ? 'block' : 'none';
    }
  }

  // Event Listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      highlightCollectionCard(categorySelect.value);
      applyFilters();
    });
  }
  if (playersSelect) playersSelect.addEventListener('change', applyFilters);
  if (diffSelect) diffSelect.addEventListener('change', applyFilters);
  if (availSelect) availSelect.addEventListener('change', applyFilters);

  // Clear filters
  const resetAll = () => {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'all';
    if (playersSelect) playersSelect.value = 'all';
    if (diffSelect) diffSelect.value = 'all';
    if (availSelect) availSelect.value = 'all';
    highlightCollectionCard('all');
    applyFilters();
  };

  if (clearBtn) clearBtn.addEventListener('click', resetAll);
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  // Collection card clicks
  collectionBanners.forEach(banner => {
    banner.addEventListener('click', () => {
      const filter = banner.getAttribute('data-collection-filter');
      if (categorySelect) {
        categorySelect.value = filter;
        highlightCollectionCard(filter);
        applyFilters();
        // Smooth scroll to discovery grid
        const resultsGrid = document.getElementById('collection-results-grid');
        if (resultsGrid) resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Run on initial load
  applyFilters();
}

/**
 * 10. Header Quick Search integration
 */
function initNavSearch() {
  const navInput = document.getElementById('nav-search-input');
  const mobileInput = document.getElementById('mobile-search-input');
  const catalogueInput = document.getElementById('catalogue-search-input');

  const handleNavSearch = (input) => {
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (catalogueInput) {
          catalogueInput.value = query;
          catalogueInput.dispatchEvent(new Event('input'));
          const section = document.getElementById('explore-collection');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = `/games/?search=${encodeURIComponent(query)}`;
        }
      }
    });
  };

  handleNavSearch(navInput);
  handleNavSearch(mobileInput);
}

/**
 * 11. Game Detail Information Tabs
 */
function initGameTabs() {
  const tabBtns = document.querySelectorAll('.game-tab-btn');
  const tabPanes = document.querySelectorAll('.game-tab-pane');

  if (!tabBtns.length || !tabPanes.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetPane = document.getElementById(`tab-${targetTab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}
