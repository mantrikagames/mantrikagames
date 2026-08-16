/**
 * reversi-3d.js — Handcrafted 3D Reversi (Othello) Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const GRID_SIZE = 8;
  let board = [];
  let currentPlayer = 'dark'; // 'dark' (P1) or 'light' (P2/AI)
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;
  let moveHistory = [];

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;

  function initReversi() {
    canvas = document.getElementById('reversi-canvas');
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
    board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    // Initial 4 center discs
    board[3][3] = 'light';
    board[3][4] = 'dark';
    board[4][3] = 'dark';
    board[4][4] = 'light';

    currentPlayer = 'dark';
    gameOver = false;
    moveHistory = [];
    updateHUD('Dark to move');
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'light') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const pad = size * 0.08;
    const cellSize = (size - pad * 2) / GRID_SIZE;

    const c = Math.floor((x - pad) / cellSize);
    const r = Math.floor((y - pad) / cellSize);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const flips = getFlips(r, c, currentPlayer);
      if (flips.length > 0) {
        makeMove(r, c, currentPlayer, flips);
      }
    }
  }

  function getFlips(r, c, player) {
    if (board[r][c] !== null) return [];

    const opp = player === 'dark' ? 'light' : 'dark';
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let totalFlips = [];

    for (let [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      let path = [];

      while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc] === opp) {
        path.push({ r: nr, c: nc });
        nr += dr;
        nc += dc;
      }

      if (path.length > 0 && nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc] === player) {
        totalFlips.push(...path);
      }
    }

    return totalFlips;
  }

  function makeMove(r, c, player, flips) {
    board[r][c] = player;
    flips.forEach(f => {
      board[f.r][f.c] = player;
    });

    moveHistory.push({ r, c, player, flipsCount: flips.length });

    const opp = player === 'dark' ? 'light' : 'dark';
    const oppMoves = getValidMoves(opp);
    const playerMoves = getValidMoves(player);

    if (oppMoves.length > 0) {
      currentPlayer = opp;
    } else if (playerMoves.length === 0) {
      gameOver = true;
      const scores = getScores();
      let winMsg = scores.dark > scores.light ? 'DARK WINS!' : (scores.light > scores.dark ? 'LIGHT WINS!' : 'DRAW GAME!');
      updateHUD(`🎉 GAME OVER — ${winMsg} (${scores.dark} vs ${scores.light})`);
      render();
      return;
    } else {
      updateHUD(`${opp.toUpperCase()} HAS NO VALID MOVES — ${player.toUpperCase()} MOVES AGAIN!`);
    }

    const scores = getScores();
    updateHUD(`${currentPlayer.toUpperCase()}'s turn | Dark: ${scores.dark} • Light: ${scores.light}`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'light' && !gameOver) {
      setTimeout(makeAIMove, 450);
    }
  }

  function getValidMoves(player) {
    let moves = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const flips = getFlips(r, c, player);
        if (flips.length > 0) {
          moves.push({ r, c, flips });
        }
      }
    }
    return moves;
  }

  function getScores() {
    let dark = 0, light = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 'dark') dark++;
        else if (board[r][c] === 'light') light++;
      }
    }
    return { dark, light };
  }

  function makeAIMove() {
    if (gameOver) return;
    const validMoves = getValidMoves('light');
    if (validMoves.length === 0) return;

    // Corner priority heuristic
    validMoves.sort((a, b) => {
      const isCornerA = (a.r === 0 || a.r === 7) && (a.c === 0 || a.c === 7);
      const isCornerB = (b.r === 0 || b.r === 7) && (b.c === 0 || b.c === 7);
      if (isCornerA && !isCornerB) return -1;
      if (!isCornerA && isCornerB) return 1;
      return b.flips.length - a.flips.length;
    });

    const choice = validMoves[0];
    makeMove(choice.r, choice.c, 'light', choice.flips);
  }

  function updateHUD(msg) {
    if (hudMessage) hudMessage.textContent = msg;
    const scores = getScores();
    if (turnNameText) turnNameText.textContent = `${currentPlayer.toUpperCase()} (D:${scores.dark} L:${scores.light})`;
    if (turnNameDot) {
      turnNameDot.style.background = currentPlayer === 'dark' ? '#1A1A1A' : '#FAF8F3';
      turnNameDot.style.border = currentPlayer === 'dark' ? '1px solid #666' : '1px solid #CCC';
    }
  }

  function render() {
    if (!canvas || !ctx || !board || !board.length) return;
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

    // Inset Felt Grid Cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1C402E' : '#143022';
        ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = '#0F2419';
        ctx.strokeRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);

        // Highlight valid moves for active human player
        if (!gameOver && (gameMode === 'local' || currentPlayer === 'dark')) {
          const flips = getFlips(r, c, currentPlayer);
          if (flips.length > 0) {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
            ctx.beginPath();
            ctx.arc(pad + (c + 0.5) * cellSize, pad + (r + 0.5) * cellSize, cellSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Render Discs
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] !== null) {
          const x = pad + (c + 0.5) * cellSize;
          const y = pad + (r + 0.5) * cellSize;
          const isDark = board[r][c] === 'dark';

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(x + 2.5, y + 3.5, cellSize * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Side Edge Thickness
          ctx.fillStyle = isDark ? '#0A0A0A' : '#C7BBA5';
          ctx.beginPath();
          ctx.arc(x, y + 1.4, cellSize * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Disc Top Body
          const discGrad = ctx.createRadialGradient(x - cellSize * 0.15, y - cellSize * 0.15, cellSize * 0.05, x, y, cellSize * 0.4);
          if (isDark) {
            discGrad.addColorStop(0, '#4A4A4A');
            discGrad.addColorStop(0.5, '#242424');
            discGrad.addColorStop(1, '#080808');
          } else {
            discGrad.addColorStop(0, '#FFFFFF');
            discGrad.addColorStop(0.5, '#F7F3E9');
            discGrad.addColorStop(1, '#D6C8AA');
          }

          ctx.fillStyle = discGrad;
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Gloss Sheen
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(x - cellSize * 0.12, y - cellSize * 0.12, cellSize * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initReversi);

})();
