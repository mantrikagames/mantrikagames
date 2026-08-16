/**
 * board-showcase.js — Reusable 3D Physical Board Game Showcase Engine
 * Mantrika Games — Pure HTML5 Canvas & Procedural 3D Tabletop Rendering
 */

(function () {
  'use strict';

  function createBoardShowcase(container, type, options) {
    if (!container) return;
    options = options || {};

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = options.size || 300;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.borderRadius = '8px';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    renderBoard(ctx, type, size, options);
  }

  function renderBoard(ctx, type, size, opts) {
    ctx.clearRect(0, 0, size, size);

    // 1. Draw 3D Wooden Slab Base
    drawWoodenSlab(ctx, size);

    // 2. Draw Board Specific Geometry & Pieces
    switch (type) {
      case 'mills':
      case 'nine-mens-morris':
        drawMillsBoard(ctx, size);
        break;
      case 'square':
      case 'gomoku':
        drawSquareGridBoard(ctx, size);
        break;
      case 'reversi':
        drawReversiBoard(ctx, size);
        break;
      case 'ataxx':
        drawAtaxxBoard(ctx, size);
        break;
      case 'hex':
        drawHexBoard(ctx, size);
        break;
      case 'quoridor':
        drawQuoridorBoard(ctx, size);
        break;
      case 'surakarta':
        drawSurakartaBoard(ctx, size);
        break;
      case 'mancala':
      case 'pallanguzhi':
        drawMancalaBoard(ctx, size);
        break;
      case 'pretwa':
        drawPretwaBoard(ctx, size);
        break;
      case 'cross':
      case 'pachisi':
      case 'chaupar':
        drawCrossBoard(ctx, size);
        break;
      case 'twelve-beads':
      default:
        drawDiamondBoard(ctx, size);
        break;
    }
  }

  // 1. Wooden Base Slab
  function drawWoodenSlab(ctx, size) {
    // Outer Walnut Frame
    const frameGrad = ctx.createLinearGradient(0, 0, size, size);
    frameGrad.addColorStop(0, '#422213');
    frameGrad.addColorStop(0.5, '#2B160C');
    frameGrad.addColorStop(1, '#1A0B05');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 12);
    ctx.fill();

    // Inner Surface Recess
    const pad = size * 0.05;
    const innerGrad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.6);
    innerGrad.addColorStop(0, '#5C361D');
    innerGrad.addColorStop(0.7, '#3D2413');
    innerGrad.addColorStop(1, '#24140A');

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.roundRect(pad, pad, size - pad * 2, size - pad * 2, 8);
    ctx.fill();

    // Gold Bevel Edge Rim
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 2. Mills / Nine Men's Morris Board
  function drawMillsBoard(ctx, size) {
    const center = size / 2;
    const margins = [size * 0.12, size * 0.24, size * 0.36];

    ctx.strokeStyle = 'rgba(255, 230, 160, 0.85)';
    ctx.lineWidth = 2.5;

    margins.forEach(m => {
      ctx.strokeRect(m, m, size - m * 2, size - m * 2);
    });

    // Cross connecting lines
    ctx.beginPath();
    ctx.moveTo(margins[0], center); ctx.lineTo(margins[2], center);
    ctx.moveTo(size - margins[0], center); ctx.lineTo(size - margins[2], center);
    ctx.moveTo(center, margins[0]); ctx.lineTo(center, margins[2]);
    ctx.moveTo(center, size - margins[0]); ctx.lineTo(center, size - margins[2]);
    ctx.stroke();

    // Sample 3D Stones
    draw3DStone(ctx, margins[0], margins[0], size * 0.04, true);
    draw3DStone(ctx, center, margins[0], size * 0.04, false);
    draw3DStone(ctx, size - margins[0], margins[0], size * 0.04, true);
    draw3DStone(ctx, margins[1], center, size * 0.04, false);
    draw3DStone(ctx, margins[2], margins[2], size * 0.04, true);
  }

  // 3. Gomoku / Square Grid Board
  function drawSquareGridBoard(ctx, size) {
    const pad = size * 0.1;
    const gridDim = 9;
    const step = (size - pad * 2) / (gridDim - 1);

    ctx.strokeStyle = 'rgba(255, 230, 160, 0.65)';
    ctx.lineWidth = 1.2;

    for (let i = 0; i < gridDim; i++) {
      ctx.beginPath();
      ctx.moveTo(pad + i * step, pad);
      ctx.lineTo(pad + i * step, size - pad);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pad, pad + i * step);
      ctx.lineTo(size - pad, pad + i * step);
      ctx.stroke();
    }

    // Star points
    [2, 6].forEach(r => {
      [2, 6].forEach(c => {
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(pad + c * step, pad + r * step, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 3D Go Stones
    draw3DStone(ctx, pad + 4 * step, pad + 4 * step, step * 0.42, true);
    draw3DStone(ctx, pad + 3 * step, pad + 4 * step, step * 0.42, false);
    draw3DStone(ctx, pad + 4 * step, pad + 5 * step, step * 0.42, true);
    draw3DStone(ctx, pad + 5 * step, pad + 4 * step, step * 0.42, false);
  }

  // 4. Reversi 8x8 Board
  function drawReversiBoard(ctx, size) {
    const pad = size * 0.1;
    const cellSize = (size - pad * 2) / 8;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1C402E' : '#143022';
        ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = '#0F2419';
        ctx.strokeRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
      }
    }

    // Center 4 discs
    draw3DStone(ctx, pad + 3.5 * cellSize, pad + 3.5 * cellSize, cellSize * 0.4, true);
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 4.5 * cellSize, cellSize * 0.4, true);
    draw3DStone(ctx, pad + 3.5 * cellSize, pad + 4.5 * cellSize, cellSize * 0.4, false);
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 3.5 * cellSize, cellSize * 0.4, false);
  }

  // 5. Ataxx 7x7 Board
  function drawAtaxxBoard(ctx, size) {
    const pad = size * 0.1;
    const cellSize = (size - pad * 2) / 7;

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.fillStyle = '#2A1F18';
        ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.strokeRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
      }
    }

    // Tokens at corners
    draw3DStone(ctx, pad + 0.5 * cellSize, pad + 0.5 * cellSize, cellSize * 0.38, true);
    draw3DStone(ctx, pad + 6.5 * cellSize, pad + 6.5 * cellSize, cellSize * 0.38, true);
    draw3DStone(ctx, pad + 0.5 * cellSize, pad + 6.5 * cellSize, cellSize * 0.38, false);
    draw3DStone(ctx, pad + 6.5 * cellSize, pad + 0.5 * cellSize, cellSize * 0.38, false);
  }

  // 6. Hex Board
  function drawHexBoard(ctx, size) {
    const center = size / 2;
    const r = size * 0.055;

    for (let row = -3; row <= 3; row++) {
      for (let col = -3; col <= 3; col++) {
        if (Math.abs(row + col) > 3) continue;
        const x = center + col * r * 1.73 + row * r * 0.86;
        const y = center + row * r * 1.5;

        drawSingleHex(ctx, x, y, r);
      }
    }

    draw3DStone(ctx, center, center, r * 0.75, true);
    draw3DStone(ctx, center + r * 1.73, center, r * 0.75, false);
  }

  function drawSingleHex(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#331E12';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.stroke();
  }

  // 7. Quoridor Board with Physical Walls
  function drawQuoridorBoard(ctx, size) {
    const pad = size * 0.1;
    const cellSize = (size - pad * 2) / 9;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        ctx.fillStyle = '#2D1B10';
        ctx.fillRect(pad + c * cellSize + 1, pad + r * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }

    // 3D Pawns
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 0.5 * cellSize, cellSize * 0.38, true);
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 8.5 * cellSize, cellSize * 0.38, false);

    // 3D Wood Wall Barrier
    ctx.fillStyle = '#D4AF37';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillRect(pad + 3 * cellSize, pad + 4 * cellSize - 3, cellSize * 2, 6);
    ctx.shadowBlur = 0;
  }

  // 8. Surakarta Board with Circular Loops
  function drawSurakartaBoard(ctx, size) {
    const pad = size * 0.15;
    const step = (size - pad * 2) / 5;

    ctx.strokeStyle = 'rgba(255, 230, 160, 0.75)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(pad + i * step, pad); ctx.lineTo(pad + i * step, size - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + i * step); ctx.lineTo(size - pad, pad + i * step); ctx.stroke();
    }

    // Corner Loops
    [pad + step, pad + step * 2].forEach(radius => {
      ctx.beginPath(); ctx.arc(pad, pad, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(size - pad, pad, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(pad, size - pad, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(size - pad, size - pad, radius, 0, Math.PI * 2); ctx.stroke();
    });

    draw3DStone(ctx, pad, pad, step * 0.35, true);
    draw3DStone(ctx, pad + step, pad, step * 0.35, true);
    draw3DStone(ctx, pad, size - pad, step * 0.35, false);
    draw3DStone(ctx, pad + step, size - pad, step * 0.35, false);
  }

  // 9. Mancala / Pallanguzhi Trough Board
  function drawMancalaBoard(ctx, size) {
    const pad = size * 0.1;
    const cupR = size * 0.055;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 7; c++) {
        const x = pad + c * (size - pad * 2) / 6;
        const y = pad + (r + 0.6) * (size - pad * 2) / 2.2;

        ctx.fillStyle = '#1A0E07';
        ctx.beginPath(); ctx.arc(x, y, cupR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'; ctx.stroke();

        // Seeds
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath(); ctx.arc(x - 3, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 3, y + 2, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // 10. Pretwa Mandala Board
  function drawPretwaBoard(ctx, size) {
    const center = size / 2;
    const radii = [size * 0.12, size * 0.24, size * 0.36];

    ctx.strokeStyle = 'rgba(255, 230, 160, 0.75)';
    ctx.lineWidth = 1.5;

    radii.forEach(r => {
      ctx.beginPath(); ctx.arc(center, center, r, 0, Math.PI * 2); ctx.stroke();
    });

    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(center - Math.cos(angle) * radii[2], center - Math.sin(angle) * radii[2]);
      ctx.lineTo(center + Math.cos(angle) * radii[2], center + Math.sin(angle) * radii[2]);
      ctx.stroke();
    }

    draw3DStone(ctx, center, center, radii[0] * 0.45, true);
  }

  // 11. Cross Board (Pachisi / Chaupar)
  function drawCrossBoard(ctx, size) {
    const center = size / 2;
    const armW = size * 0.22;
    const armL = size * 0.36;

    ctx.fillStyle = '#2A180E';
    ctx.fillRect(center - armW / 2, center - armL, armW, armL * 2);
    ctx.fillRect(center - armL, center - armW / 2, armL * 2, armW);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.strokeRect(center - armW / 2, center - armL, armW, armL * 2);
    ctx.strokeRect(center - armL, center - armW / 2, armL * 2, armW);

    draw3DStone(ctx, center, center, armW * 0.25, true);
  }

  // 12. Diamond Board (Twelve Beads)
  function drawDiamondBoard(ctx, size) {
    const pad = size * 0.12;
    const width = size - pad * 2;
    const step = width / 4;

    ctx.strokeStyle = 'rgba(255, 230, 160, 0.7)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(pad + i * step, pad); ctx.lineTo(pad + i * step, size - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + i * step); ctx.lineTo(size - pad, pad + i * step); ctx.stroke();
    }

    draw3DStone(ctx, pad + 2 * step, pad + 2 * step, step * 0.35, true);
  }

  // Shared 3D Stone Renderer
  function draw3DStone(ctx, x, y, r, isGold) {
    // Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(x + 2.5, y + 3.5, r, 0, Math.PI * 2);
    ctx.fill();

    // 3D Side Thickness
    ctx.fillStyle = isGold ? '#101010' : '#C7BBA5';
    ctx.beginPath();
    ctx.arc(x, y + 1.2, r, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    if (isGold) {
      grad.addColorStop(0, '#FFF4B3');
      grad.addColorStop(0.4, '#FFD700');
      grad.addColorStop(1, '#805E00');
    } else {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.5, '#F7F3E9');
      grad.addColorStop(1, '#D6C8AA');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.96, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight
    ctx.fillStyle = isGold ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  window.createBoardShowcase = createBoardShowcase;

})();
