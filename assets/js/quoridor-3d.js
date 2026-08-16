/**
 * quoridor-3d.js — Handcrafted 3D Quoridor Maze Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const GRID_SIZE = 9;
  let p1Pos = { r: 8, c: 4 }; // Gold (Bottom -> Top row 0)
  let p2Pos = { r: 0, c: 4 }; // Ivory (Top -> Bottom row 8)
  let currentPlayer = 'gold';
  let walls = []; // { r, c, isHorizontal, player }
  let remainingWalls = { gold: 10, ivory: 10 };
  let activeTool = 'move'; // 'move' or 'wall'
  let isWallHorizontal = true;
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;

  function initQuoridor() {
    canvas = document.getElementById('quoridor-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resetBoard();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initDOM();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(rect.width, 600);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    ctx.scale(dpr, dpr);
    render();
  }

  function initDOM() {
    hudMessage = document.getElementById('hud-message-banner');
    turnNameDot = document.getElementById('current-player-color-dot');
    turnNameText = document.getElementById('current-player-name');

    const setupModal = document.getElementById('game-setup-modal');
    const startBtn = document.getElementById('start-game-btn');

    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.getAttribute('data-mode');
        const diffGroup = document.getElementById('ai-difficulty-group');
        if (diffGroup) diffGroup.style.display = gameMode === 'ai' ? 'block' : 'none';
      });
    });

    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aiDifficulty = btn.getAttribute('data-diff');
      });
    });

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (setupModal) setupModal.style.display = 'none';
        const hud = document.getElementById('game-hud-overlay');
        if (hud) hud.style.display = 'block';
        const loader = document.getElementById('game-loading-overlay');
        if (loader) loader.style.display = 'none';
        resetBoard();
      });
    }

    canvas.addEventListener('click', handleCanvasClick);
  }

  function resetBoard() {
    p1Pos = { r: 8, c: 4 };
    p2Pos = { r: 0, c: 4 };
    currentPlayer = 'gold';
    walls = [];
    remainingWalls = { gold: 10, ivory: 10 };
    activeTool = 'move';
    gameOver = false;
    updateHUD('Gold to move pawn');
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'ivory') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const pad = size * 0.08;
    const cellSize = (size - pad * 2) / GRID_SIZE;

    const c = Math.floor((x - pad) / cellSize);
    const r = Math.floor((y - pad) / cellSize);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const myPos = currentPlayer === 'gold' ? p1Pos : p2Pos;
      const dr = Math.abs(r - myPos.r);
      const dc = Math.abs(c - myPos.c);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        if (currentPlayer === 'gold') p1Pos = { r, c };
        else p2Pos = { r, c };

        if (currentPlayer === 'gold' && r === 0) {
          gameOver = true;
          updateHUD('🎉 GOLD WINS THE RACE!');
          render();
          return;
        } else if (currentPlayer === 'ivory' && r === 8) {
          gameOver = true;
          updateHUD('🎉 IVORY WINS THE RACE!');
          render();
          return;
        }

        currentPlayer = currentPlayer === 'gold' ? 'ivory' : 'gold';
        updateHUD(`${currentPlayer.toUpperCase()}'s turn | Gold Walls: ${remainingWalls.gold} • Ivory Walls: ${remainingWalls.ivory}`);
        render();

        if (gameMode === 'ai' && currentPlayer === 'ivory' && !gameOver) {
          setTimeout(makeAIMove, 450);
        }
      }
    }
  }

  function makeAIMove() {
    if (gameOver) return;
    // Move pawn towards target row 8
    const r = p2Pos.r;
    const c = p2Pos.c;

    if (r + 1 < GRID_SIZE) {
      p2Pos = { r: r + 1, c };
    } else if (c + 1 < GRID_SIZE) {
      p2Pos = { r, c: c + 1 };
    }

    if (p2Pos.r === 8) {
      gameOver = true;
      updateHUD('🎉 IVORY (AI) WINS THE RACE!');
      render();
      return;
    }

    currentPlayer = 'gold';
    updateHUD(`GOLD's turn | Gold Walls: ${remainingWalls.gold} • Ivory Walls: ${remainingWalls.ivory}`);
    render();
  }

  function updateHUD(msg) {
    if (hudMessage) hudMessage.textContent = msg;
    if (turnNameText) turnNameText.textContent = `${currentPlayer.toUpperCase()}`;
    if (turnNameDot) {
      turnNameDot.style.background = currentPlayer === 'gold' ? '#FFD700' : '#FAF8F3';
      turnNameDot.style.border = '1px solid #FFF';
    }
  }

  function render() {
    if (!canvas || !ctx) return;
    const size = canvas.width / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, size, size);

    // Frame
    const frameGrad = ctx.createLinearGradient(0, 0, size, size);
    frameGrad.addColorStop(0, '#422213');
    frameGrad.addColorStop(0.5, '#2B160C');
    frameGrad.addColorStop(1, '#1A0B05');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 12);
    ctx.fill();

    const pad = size * 0.08;
    const cellSize = (size - pad * 2) / GRID_SIZE;

    // Recessed Grid Cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = '#2D1B10';
        ctx.fillRect(pad + c * cellSize + 1, pad + r * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }

    // Baseline Target Goal Line Accents
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, size - pad * 2, 2); // Row 0 target for Gold
    ctx.strokeStyle = '#FAF8F3';
    ctx.strokeRect(pad, size - pad - 2, size - pad * 2, 2); // Row 8 target for Ivory

    // Render Pawns
    drawPawn(ctx, pad + (p1Pos.c + 0.5) * cellSize, pad + (p1Pos.r + 0.5) * cellSize, cellSize * 0.38, true);
    drawPawn(ctx, pad + (p2Pos.c + 0.5) * cellSize, pad + (p2Pos.r + 0.5) * cellSize, cellSize * 0.38, false);
  }

  function drawPawn(ctx, x, y, r, isGold) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(x + 2.5, y + 3.5, r, 0, Math.PI * 2);
    ctx.fill();

    // Side Thickness
    ctx.fillStyle = isGold ? '#805E00' : '#C7BBA5';
    ctx.beginPath();
    ctx.arc(x, y + 1.6, r, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    if (isGold) {
      grad.addColorStop(0, '#FFF4B3');
      grad.addColorStop(0.5, '#FFD700');
      grad.addColorStop(1, '#805E00');
    } else {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.5, '#F7F3E9');
      grad.addColorStop(1, '#D6C8AA');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Lathe Collar Ring
    ctx.strokeStyle = isGold ? 'rgba(255, 255, 255, 0.65)' : 'rgba(180, 160, 130, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight
    ctx.fillStyle = isGold ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  document.addEventListener('DOMContentLoaded', initQuoridor);

})();
