/**
 * gomoku-3d.js — Handcrafted 3D Gomoku (Five in a Row) Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const GRID_SIZE = 15;
  let board = [];
  let currentPlayer = 'black'; // 'black' (P1) or 'white' (P2/AI)
  let gameMode = 'ai'; // 'ai' or 'local'
  let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
  let gameOver = false;
  let moveHistory = [];

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;

  function initGomoku() {
    canvas = document.getElementById('gomoku-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initDOM();
    resetBoard();
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
    board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    currentPlayer = 'black';
    gameOver = false;
    moveHistory = [];
    updateHUD('Black to place stone #1');
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'white') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const pad = size * 0.08;
    const step = (size - pad * 2) / (GRID_SIZE - 1);

    const c = Math.round((x - pad) / step);
    const r = Math.round((y - pad) / step);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      if (board[r][c] === null) {
        makeMove(r, c, currentPlayer);
      }
    }
  }

  function makeMove(r, c, player) {
    board[r][c] = player;
    moveHistory.push({ r, c, player });

    if (checkWin(r, c, player)) {
      gameOver = true;
      updateHUD(`🎉 ${player.toUpperCase()} WINS WITH 5 IN A ROW!`);
      render();
      return;
    }

    currentPlayer = player === 'black' ? 'white' : 'black';
    updateHUD(`${currentPlayer.toUpperCase()}'s turn to place stone #${moveHistory.length + 1}`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'white' && !gameOver) {
      setTimeout(makeAIMove, 400);
    }
  }

  function makeAIMove() {
    if (gameOver) return;
    let bestMove = findBestMove();
    if (bestMove) {
      makeMove(bestMove.r, bestMove.c, 'white');
    }
  }

  function findBestMove() {
    // Check for winning move
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === null) {
          board[r][c] = 'white';
          if (checkWin(r, c, 'white')) {
            board[r][c] = null;
            return { r, c };
          }
          board[r][c] = null;
        }
      }
    }

    // Check for blocking opponent win
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === null) {
          board[r][c] = 'black';
          if (checkWin(r, c, 'black')) {
            board[r][c] = null;
            return { r, c };
          }
          board[r][c] = null;
        }
      }
    }

    // Otherwise place near center or existing stones
    const center = Math.floor(GRID_SIZE / 2);
    let candidates = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === null) {
          const dist = Math.abs(r - center) + Math.abs(c - center);
          candidates.push({ r, c, dist });
        }
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0] || { r: center, c: center };
  }

  function checkWin(r, c, player) {
    const dirs = [
      [[0, 1], [0, -1]],   // Horizontal
      [[1, 0], [-1, 0]],   // Vertical
      [[1, 1], [-1, -1]],  // Main diagonal
      [[1, -1], [-1, 1]]   // Anti diagonal
    ];

    for (let d of dirs) {
      let count = 1;
      for (let step of d) {
        let nr = r + step[0];
        let nc = c + step[1];
        while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc] === player) {
          count++;
          nr += step[0];
          nc += step[1];
        }
      }
      if (count >= 5) return true;
    }
    return false;
  }

  function updateHUD(msg) {
    if (hudMessage) hudMessage.textContent = msg;
    if (turnNameText) turnNameText.textContent = `${currentPlayer.toUpperCase()} (${moveHistory.length + 1})`;
    if (turnNameDot) {
      turnNameDot.style.background = currentPlayer === 'black' ? '#1A1A1A' : '#FAF8F3';
      turnNameDot.style.border = currentPlayer === 'black' ? '1px solid #666' : '1px solid #CCC';
    }
  }

  function render() {
    if (!canvas || !ctx) return;
    const size = canvas.width / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, size, size);

    // 1. Wood Slab
    const frameGrad = ctx.createLinearGradient(0, 0, size, size);
    frameGrad.addColorStop(0, '#422213');
    frameGrad.addColorStop(0.5, '#2B160C');
    frameGrad.addColorStop(1, '#1A0B05');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 12);
    ctx.fill();

    const pad = size * 0.08;
    const innerGrad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.6);
    innerGrad.addColorStop(0, '#5C361D');
    innerGrad.addColorStop(0.7, '#3D2413');
    innerGrad.addColorStop(1, '#24140A');

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.roundRect(pad * 0.5, pad * 0.5, size - pad, size - pad, 8);
    ctx.fill();

    // 2. Grid lines
    const step = (size - pad * 2) / (GRID_SIZE - 1);
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.65)';
    ctx.lineWidth = 1.2;

    for (let i = 0; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(pad + i * step, pad);
      ctx.lineTo(pad + i * step, size - pad);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pad, pad + i * step);
      ctx.lineTo(size - pad, pad + i * step);
      ctx.stroke();
    }

    // Hoshi rivets
    [3, 7, 11].forEach(r => {
      [3, 7, 11].forEach(c => {
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(pad + c * step, pad + r * step, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 3. Render 3D Stones
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] !== null) {
          const x = pad + c * step;
          const y = pad + r * step;
          const isBlack = board[r][c] === 'black';

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(x + 2.5, y + 3.5, step * 0.42, 0, Math.PI * 2);
          ctx.fill();

          // Side Thickness
          ctx.fillStyle = isBlack ? '#0A0A0A' : '#C7BBA5';
          ctx.beginPath();
          ctx.arc(x, y + 1.2, step * 0.42, 0, Math.PI * 2);
          ctx.fill();

          // Body
          const stoneGrad = ctx.createRadialGradient(x - step * 0.15, y - step * 0.15, step * 0.05, x, y, step * 0.42);
          if (isBlack) {
            stoneGrad.addColorStop(0, '#4A4A4A');
            stoneGrad.addColorStop(0.5, '#242424');
            stoneGrad.addColorStop(1, '#080808');
          } else {
            stoneGrad.addColorStop(0, '#FFFFFF');
            stoneGrad.addColorStop(0.5, '#F7F3E9');
            stoneGrad.addColorStop(1, '#D6C8AA');
          }

          ctx.fillStyle = stoneGrad;
          ctx.beginPath();
          ctx.arc(x, y, step * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Specular Sheen
          ctx.fillStyle = isBlack ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(x - step * 0.12, y - step * 0.12, step * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initGomoku);

})();
