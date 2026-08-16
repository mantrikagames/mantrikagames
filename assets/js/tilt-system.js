/**
 * tilt-system.js — Lightweight 3D Cursor Tilt & Micro-Interaction Engine
 * Mantrika Games — Pure Vanilla JS + requestAnimationFrame
 */

(function () {
  'use strict';

  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createTilt(element, options) {
    if (!element || isTouchDevice || isReducedMotion) return;

    const opts = Object.assign({
      maxTilt: 12,
      perspective: 1000,
      scale: 1.03,
      speed: 400,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    }, options || {});

    let rect = null;
    let animFrame = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    element.style.transformStyle = 'preserve-3d';
    element.style.transition = `transform ${opts.speed}ms ${opts.easing}`;

    function onMouseEnter() {
      rect = element.getBoundingClientRect();
      element.style.transition = 'none';
    }

    function onMouseMove(e) {
      if (!rect) rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      targetX = (0.5 - y) * opts.maxTilt;
      targetY = (x - 0.5) * opts.maxTilt;

      if (!animFrame) {
        animFrame = requestAnimationFrame(updateTilt);
      }
    }

    function updateTilt() {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      element.style.transform = `perspective(${opts.perspective}px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg) scale3d(${opts.scale}, ${opts.scale}, 1)`;

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        animFrame = requestAnimationFrame(updateTilt);
      } else {
        animFrame = null;
      }
    }

    function onMouseLeave() {
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = null;
      element.style.transition = `transform ${opts.speed}ms ${opts.easing}`;
      element.style.transform = `perspective(${opts.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }

    element.addEventListener('mouseenter', onMouseEnter);
    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseleave', onMouseLeave);
  }

  function initAllTilts() {
    if (isTouchDevice || isReducedMotion) return;
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const maxTilt = parseFloat(el.getAttribute('data-tilt-max')) || 10;
      createTilt(el, { maxTilt: maxTilt });
    });
  }

  window.createTilt = createTilt;
  document.addEventListener('DOMContentLoaded', initAllTilts);

})();
