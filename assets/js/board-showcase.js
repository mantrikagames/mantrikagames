/**
 * board-showcase.js — Luxury Handcrafted 3D Physical Board Game Showcase Engine
 * Mantrika Games — Pure HTML5 Canvas & Procedural 3D Tabletop Rendering
 */

(function () {
  'use strict';

  function createBoardShowcase(container, type, options) {
    if (!container) return;
    options = options || {};

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = options.size || 320;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.borderRadius = '12px';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    renderBoard(ctx, type, size, options);
  }

  function renderBoard(ctx, type, size, opts) {
    ctx.clearRect(0, 0, size, size);

    // 1. Draw Luxury Multi-Layer Hand-Carved Wooden Slab Base
    drawLuxuryWoodenSlab(ctx, size);

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

  // 1. Luxury Multi-Layer Wooden Slab with Brass Corner Brackets
  function drawLuxuryWoodenSlab(ctx, size) {
    // Outer Deep Walnut Bevel Base
    const frameGrad = ctx.createLinearGradient(0, 0, size, size);
    frameGrad.addColorStop(0, '#5C361D');
    frameGrad.addColorStop(0.3, '#3A1F10');
    frameGrad.addColorStop(0.7, '#241309');
    frameGrad.addColorStop(1, '#120904');
    
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 14);
    ctx.fill();

    // Top-Left Bevel Specular Sheen
    ctx.strokeStyle = 'rgba(255, 235, 180, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, size - 2, size - 2, 13);
    ctx.stroke();

    // Inner Gold Inlay Groove Frame
    const pad1 = size * 0.04;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pad1, pad1, size - pad1 * 2, size - pad1 * 2, 10);
    ctx.stroke();

    // Inlaid Polished Mahogany Playing Surface
    const pad2 = size * 0.06;
    const innerGrad = ctx.createRadialGradient(size * 0.35, size * 0.35, 10, size / 2, size / 2, size * 0.65);
    innerGrad.addColorStop(0, '#6E4023');
    innerGrad.addColorStop(0.4, '#4D2B17');
    innerGrad.addColorStop(0.8, '#2E190C');
    innerGrad.addColorStop(1, '#1A0E06');

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.roundRect(pad2, pad2, size - pad2 * 2, size - pad2 * 2, 8);
    ctx.fill();

    // Inner Surface Ambient Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(pad2, pad2, size - pad2 * 2, size - pad2 * 2, 8);
    ctx.stroke();

    // Brass Corner Bracket Accents
    drawCornerBracket(ctx, pad2 + 2, pad2 + 2, 0);
    drawCornerBracket(ctx, size - pad2 - 2, pad2 + 2, Math.PI / 2);
    drawCornerBracket(ctx, size - pad2 - 2, size - pad2 - 2, Math.PI);
    drawCornerBracket(ctx, pad2 + 2, size - pad2 - 2, -Math.PI / 2);
  }

  function drawCornerBracket(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(12, 4);
    ctx.lineTo(4, 4);
    ctx.lineTo(4, 12);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();

    // Specular Rivet
    ctx.fillStyle = '#FFF5B8';
    ctx.beginPath();
    ctx.arc(6, 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 2. Mills / Nine Men's Morris Board
  function drawMillsBoard(ctx, size) {
    const center = size / 2;
    const margins = [size * 0.14, size * 0.25, size * 0.36];

    ctx.strokeStyle = '#FFE79A';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
    ctx.shadowBlur = 4;

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

    ctx.shadowBlur = 0;

    // Intersection Star Nodes
    [
      {x: margins[0], y: margins[0]}, {x: center, y: margins[0]}, {x: size - margins[0], y: margins[0]},
      {x: margins[1], y: margins[1]}, {x: center, y: margins[1]}, {x: size - margins[1], y: margins[1]},
      {x: margins[2], y: margins[2]}, {x: center, y: margins[2]}, {x: size - margins[2], y: margins[2]},
      {x: margins[0], y: center}, {x: margins[1], y: center}, {x: margins[2], y: center},
      {x: size - margins[2], y: center}, {x: size - margins[1], y: center}, {x: size - margins[0], y: center},
      {x: margins[2], y: size - margins[2]}, {x: center, y: size - margins[2]}, {x: size - margins[2], y: size - margins[2]},
      {x: margins[1], y: size - margins[1]}, {x: center, y: size - margins[1]}, {x: size - margins[1], y: size - margins[1]},
      {x: margins[0], y: size - margins[0]}, {x: center, y: size - margins[0]}, {x: size - margins[0], y: size - margins[0]}
    ].forEach(pt => {
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sample 3D Stones
    draw3DStone(ctx, margins[0], margins[0], size * 0.045, true);
    draw3DStone(ctx, center, margins[0], size * 0.045, false);
    draw3DStone(ctx, size - margins[0], margins[0], size * 0.045, true);
    draw3DStone(ctx, margins[1], center, size * 0.045, false);
    draw3DStone(ctx, margins[2], margins[2], size * 0.045, true);
  }

  // 3. Gomoku / Square Grid Board
  function drawSquareGridBoard(ctx, size) {
    const pad = size * 0.12;
    const gridDim = 9;
    const step = (size - pad * 2) / (gridDim - 1);

    ctx.strokeStyle = '#FFE79A';
    ctx.lineWidth = 1.4;

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

    // Brass Hoshi rivets
    [2, 6].forEach(r => {
      [2, 6].forEach(c => {
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(pad + c * step, pad + r * step, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 3D Go Stones
    draw3DStone(ctx, pad + 4 * step, pad + 4 * step, step * 0.44, true);
    draw3DStone(ctx, pad + 3 * step, pad + 4 * step, step * 0.44, false);
    draw3DStone(ctx, pad + 4 * step, pad + 5 * step, step * 0.44, true);
    draw3DStone(ctx, pad + 5 * step, pad + 4 * step, step * 0.44, false);
  }

  // 4. Reversi 8x8 Board
  function drawReversiBoard(ctx, size) {
    const pad = size * 0.1;
    const cellSize = (size - pad * 2) / 8;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1F4733' : '#143324';
        ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = '#0F261B';
        ctx.strokeRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
      }
    }

    // Center 4 discs
    draw3DStone(ctx, pad + 3.5 * cellSize, pad + 3.5 * cellSize, cellSize * 0.42, true);
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 4.5 * cellSize, cellSize * 0.42, true);
    draw3DStone(ctx, pad + 3.5 * cellSize, pad + 4.5 * cellSize, cellSize * 0.42, false);
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 3.5 * cellSize, cellSize * 0.42, false);
  }

  // 5. Ataxx 7x7 Board
  function drawAtaxxBoard(ctx, size) {
    const pad = size * 0.1;
    const cellSize = (size - pad * 2) / 7;

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.fillStyle = '#2D2018';
        ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.strokeRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
      }
    }

    // Tokens at corners
    draw3DStone(ctx, pad + 0.5 * cellSize, pad + 0.5 * cellSize, cellSize * 0.4, true);
    draw3DStone(ctx, pad + 6.5 * cellSize, pad + 6.5 * cellSize, cellSize * 0.4, true);
    draw3DStone(ctx, pad + 0.5 * cellSize, pad + 6.5 * cellSize, cellSize * 0.4, false);
    draw3DStone(ctx, pad + 6.5 * cellSize, pad + 0.5 * cellSize, cellSize * 0.4, false);
  }

  // 6. Hex Board
  function drawHexBoard(ctx, size) {
    const center = size / 2;
    const r = size * 0.058;

    for (let row = -3; row <= 3; row++) {
      for (let col = -3; col <= 3; col++) {
        if (Math.abs(row + col) > 3) continue;
        const x = center + col * r * 1.73 + row * r * 0.86;
        const y = center + row * r * 1.5;

        drawSingleHex(ctx, x, y, r);
      }
    }

    draw3DStone(ctx, center, center, r * 0.78, true);
    draw3DStone(ctx, center + r * 1.73, center, r * 0.78, false);
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
    ctx.fillStyle = '#3B2316';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 231, 154, 0.45)';
    ctx.stroke();
  }

  // 7. Quoridor Board with Physical Walls
  function drawQuoridorBoard(ctx, size) {
    const pad = size * 0.1;
    const cellSize = (size - pad * 2) / 9;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        ctx.fillStyle = '#2E1C12';
        ctx.fillRect(pad + c * cellSize + 1, pad + r * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }

    // 3D Pawns
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 0.5 * cellSize, cellSize * 0.4, true);
    draw3DStone(ctx, pad + 4.5 * cellSize, pad + 8.5 * cellSize, cellSize * 0.4, false);

    // 3D Physical Wood Wall Barrier
    ctx.fillStyle = '#D4AF37';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillRect(pad + 3 * cellSize, pad + 4 * cellSize - 4, cellSize * 2, 7);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#FFF5B8';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 3 * cellSize, pad + 4 * cellSize - 4, cellSize * 2, 7);
  }

  // 8. Surakarta Board with Circular Loops
  function drawSurakartaBoard(ctx, size) {
    const pad = size * 0.15;
    const step = (size - pad * 2) / 5;

    ctx.strokeStyle = '#FFE79A';
    ctx.lineWidth = 1.6;

    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(pad + i * step, pad); ctx.lineTo(pad + i * step, size - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + i * step); ctx.lineTo(size - pad, pad + i * step); ctx.stroke();
    }

    // Corner Loops
    [step, step * 2].forEach(radius => {
      ctx.beginPath(); ctx.arc(pad, pad, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(size - pad, pad, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(pad, size - pad, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(size - pad, size - pad, radius, 0, Math.PI * 2); ctx.stroke();
    });

    draw3DStone(ctx, pad, pad, step * 0.38, true);
    draw3DStone(ctx, pad + step, pad, step * 0.38, true);
    draw3DStone(ctx, pad, size - pad, step * 0.38, false);
    draw3DStone(ctx, pad + step, size - pad, step * 0.38, false);
  }

  // 9. Mancala / Pallanguzhi Trough Board
  function drawMancalaBoard(ctx, size) {
    const pad = size * 0.12;
    const cupR = size * 0.058;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 7; c++) {
        const x = pad + c * (size - pad * 2) / 6;
        const y = pad + (r + 0.6) * (size - pad * 2) / 2.2;

        ctx.fillStyle = '#1A0E07';
        ctx.beginPath(); ctx.arc(x, y, cupR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'; ctx.stroke();

        // Seeds
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath(); ctx.arc(x - 3, y - 2, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 3, y + 2, 2.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // 10. Pretwa Mandala Board
  function drawPretwaBoard(ctx, size) {
    const center = size / 2;
    const radii = [size * 0.12, size * 0.24, size * 0.36];

    ctx.strokeStyle = '#FFE79A';
    ctx.lineWidth = 1.6;

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

    draw3DStone(ctx, center, center, radii[0] * 0.48, true);
  }

  // 11. Cross Board (Pachisi / Chaupar)
  function drawCrossBoard(ctx, size) {
    const center = size / 2;
    const armW = size * 0.22;
    const armL = size * 0.36;

    ctx.fillStyle = '#2A180E';
    ctx.fillRect(center - armW / 2, center - armL, armW, armL * 2);
    ctx.fillRect(center - armL, center - armW / 2, armL * 2, armW);

    ctx.strokeStyle = '#FFE79A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(center - armW / 2, center - armL, armW, armL * 2);
    ctx.strokeRect(center - armL, center - armW / 2, armL * 2, armW);

    draw3DStone(ctx, center, center, armW * 0.28, true);
  }

  // 12. Diamond Board (Twelve Beads)
  function drawDiamondBoard(ctx, size) {
    const pad = size * 0.12;
    const width = size - pad * 2;
    const step = width / 4;

    ctx.strokeStyle = '#FFE79A';
    ctx.lineWidth = 1.6;

    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(pad + i * step, pad); ctx.lineTo(pad + i * step, size - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + i * step); ctx.lineTo(size - pad, pad + i * step); ctx.stroke();
    }

    draw3DStone(ctx, pad + 2 * step, pad + 2 * step, step * 0.38, true);
  }

  // Shared Ultra-Tactile 3D Piece Renderer
  function draw3DStone(ctx, x, y, r, isGold) {
    // 1. Dual Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(x + 3, y + 4, r * 0.98, 0, Math.PI * 2);
    ctx.fill();

    // 2. 3D Side Thickness Extrusion
    ctx.fillStyle = isGold ? '#120A04' : '#C4B8A2';
    ctx.beginPath();
    ctx.arc(x, y + 1.8, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Main Dome Body Radial Gradient
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    if (isGold) {
      grad.addColorStop(0, '#FFF6BD');
      grad.addColorStop(0.3, '#FFD700');
      grad.addColorStop(0.7, '#C69200');
      grad.addColorStop(1, '#664C00');
    } else {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.4, '#F7F3E9');
      grad.addColorStop(0.8, '#E0D4BA');
      grad.addColorStop(1, '#B5A686');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // 4. Outer Bevel Highlight Rim
    ctx.strokeStyle = isGold ? 'rgba(255, 245, 184, 0.75)' : 'rgba(190, 175, 150, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Top-Left Specular Sheen
    ctx.fillStyle = isGold ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  window.createBoardShowcase = createBoardShowcase;

})();
