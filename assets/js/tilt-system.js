/**
 * tilt-system.js — Handcrafted 3D Isometric Tabletop Tilt & Orbit Rotation Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createTilt(element, options) {
    if (!element || isReducedMotion) return;

    const opts = Object.assign({
      baseRotateX: 24,   // Default isometric X tilt angle
      baseRotateY: -6,   // Default isometric Y tilt angle
      maxTiltX: 18,      // Max delta X tilt on cursor move
      maxTiltY: 22,      // Max delta Y tilt on cursor move
      perspective: 1000,
      scale: 1.04,
      speed: 350,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    }, options || {});

    let rect = null;
    let animFrame = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    element.style.transformStyle = 'preserve-3d';
    element.style.transform = `perspective(${opts.perspective}px) rotateX(${opts.baseRotateX}deg) rotateY(${opts.baseRotateY}deg)`;

    function onMouseMove(e) {
      if (!rect) rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      targetX = (0.5 - y) * opts.maxTiltX;
      targetY = (x - 0.5) * opts.maxTiltY;

      if (!animFrame) {
        animFrame = requestAnimationFrame(updateTilt);
      }
    }

    function updateTilt() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      const finalX = opts.baseRotateX + currentX;
      const finalY = opts.baseRotateY + currentY;

      element.style.transform = `perspective(${opts.perspective}px) rotateX(${finalX.toFixed(2)}deg) rotateY(${finalY.toFixed(2)}deg) scale3d(${opts.scale}, ${opts.scale}, 1.04)`;

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        animFrame = requestAnimationFrame(updateTilt);
      } else {
        animFrame = null;
      }
    }

    function onMouseLeave() {
      targetX = 0;
      targetY = 0;
      if (!animFrame) {
        animFrame = requestAnimationFrame(updateTilt);
      }
    }

    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseleave', onMouseLeave);

    // Touch Support for Mobile Drag Orbiting
    let touchStartX = 0, touchStartY = 0;

    element.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        rect = element.getBoundingClientRect();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && rect) {
        const deltaX = (e.touches[0].clientX - touchStartX) / rect.width;
        const deltaY = (e.touches[0].clientY - touchStartY) / rect.height;
        targetX = -deltaY * opts.maxTiltX * 1.5;
        targetY = deltaX * opts.maxTiltY * 1.5;

        if (!animFrame) {
          animFrame = requestAnimationFrame(updateTilt);
        }
      }
    }, { passive: true });

    element.addEventListener('touchend', () => {
      targetX = 0;
      targetY = 0;
      if (!animFrame) animFrame = requestAnimationFrame(updateTilt);
    }, { passive: true });
  }

  function initAllTilts() {
    if (isReducedMotion) return;
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const maxTilt = parseFloat(el.getAttribute('data-tilt-max')) || 18;
      createTilt(el, { maxTiltX: maxTilt, maxTiltY: maxTilt });
    });
  }

  window.createTilt = createTilt;
  document.addEventListener('DOMContentLoaded', initAllTilts);

})();
