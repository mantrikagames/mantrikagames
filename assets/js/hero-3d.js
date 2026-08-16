/**
 * hero-3d.js — Interactive Hero 3D Board Showcase
 * Mantrika Games
 */

(function () {
  'use strict';

  function initHeroShowcase() {
    const heroBoardEl = document.getElementById('hero-board-showcase');
    if (!heroBoardEl) return;

    if (window.createBoardShowcase) {
      window.createBoardShowcase(heroBoardEl, 'mills', { size: 320 });
    }

    if (window.createTilt) {
      window.createTilt(heroBoardEl, { maxTilt: 15, scale: 1.04 });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroShowcase);
  } else {
    initHeroShowcase();
  }
})();
