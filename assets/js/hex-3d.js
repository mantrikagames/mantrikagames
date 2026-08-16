/**
 * hex-3d.js — Handcrafted 3D Hex Topology Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const BOARD_SIZE = 7;
  let board = {}; // 'r,c' => 'gold' | 'cyan'
  let currentPlayer = 'gold'; // 'gold' (Top-Bottom) or 'cyan' (Left-Right)
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;
  let moveHistory = [];

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;

  function initHex() {
    canvas = document.getElementById('hex-canvas');
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
    board = {};
    currentPlayer = 'gold';
    gameOver = false;
    moveHistory = [];
    updateHUD('Gold to connect Top & Bottom borders');
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'cyan') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const center = size / 2;
    const r = size * 0.055;

    let closestKey = null;
    let minD = Infinity;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cx = center + (col - BOARD_SIZE / 2) * r * 1.73 + (row - BOARD_SIZE / 2) * r * 0.86;
        const cy = center + (row - BOARD_SIZE / 2) * r * 1.5;
        const d = Math.hypot(x - cx, y - cy);
        if (d < r * 0.9 && d < minD) {
          minD = d;
          closestKey = `${row},${col}`;
        }
      }
    }

    if (closestKey && !board[closestKey]) {
      makeMove(closestKey, currentPlayer);
    }
  }

  function makeMove(key, player) {
    board[key] = player;
    moveHistory.push({ key, player });

    if (checkWin(player)) {
      gameOver = true;
      updateHUD(`🎉 ${player.toUpperCase()} WINS THE HEX CONNECTION!`);
      render();
      return;
    }

    currentPlayer = player === 'gold' ? 'cyan' : 'gold';
    updateHUD(`${currentPlayer.toUpperCase()}'s turn | Gold: Top-Bottom • Cyan: Left-Right`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'cyan' && !gameOver) {
      setTimeout(makeAIMove, 450);
    }
  }

  function checkWin(player) {
    let visited = new Set();
    let queue = [];

    if (player === 'gold') {
      // Connect row 0 to row BOARD_SIZE - 1
      for (let col = 0; col < BOARD_SIZE; col++) {
        const key = `0,${col}`;
        if (board[key] === 'gold') {
          queue.push(key);
          visited.add(key);
        }
      }

      while (queue.length > 0) {
        const curr = queue.shift();
        const [r, c] = curr.split(',').map(Number);

        if (r === BOARD_SIZE - 1) return true;

        const neighbors = getNeighbors(r, c);
        for (let n of neighbors) {
          const nKey = `${n.r},${n.c}`;
          if (board[nKey] === 'gold' && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push(nKey);
          }
        }
      }
    } else {
      // Connect col 0 to col BOARD_SIZE - 1
      for (let row = 0; row < BOARD_SIZE; row++) {
        const key = `${row},0`;
        if (board[key] === 'cyan') {
          queue.push(key);
          visited.add(key);
        }
      }

      while (queue.length > 0) {
        const curr = queue.shift();
        const [r, c] = curr.split(',').map(Number);

        if (c === BOARD_SIZE - 1) return true;

        const neighbors = getNeighbors(r, c);
        for (let n of neighbors) {
          const nKey = `${n.r},${n.c}`;
          if (board[nKey] === 'cyan' && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push(nKey);
          }
        }
      }
    }

    return false;
  }

  function getNeighbors(r, c) {
    const dirs = [[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]];
    let res = [];
    for (let [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        res.push({ r: nr, c: nc });
      }
    }
    return res;
  }

  function makeAIMove() {
    if (gameOver) return;
    let emptyKeys = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const key = `${r},${c}`;
        if (!board[key]) emptyKeys.push(key);
      }
    }
    if (emptyKeys.length === 0) return;

    // Pick random or center-nearest empty key
    emptyKeys.sort((a, b) => {
      const [ar, ac] = a.split(',').map(Number);
      const [br, bc] = b.split(',').map(Number);
      const distA = Math.abs(ar - 3) + Math.abs(ac - 3);
      const distB = Math.abs(br - 3) + Math.abs(bc - 3);
      return distA - distB;
    });

    makeMove(emptyKeys[0], 'cyan');
  }

  function updateHUD(msg) {
    if (hudMessage) hudMessage.textContent = msg;
    if (turnNameText) turnNameText.textContent = `${currentPlayer.toUpperCase()} (${moveHistory.length + 1})`;
    if (turnNameDot) {
      turnNameDot.style.background = currentPlayer === 'gold' ? '#FFD700' : '#00E5FF';
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

    const center = size / 2;
    const hexR = size * 0.055;

    // Render Hex Grid
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cx = center + (col - BOARD_SIZE / 2) * hexR * 1.73 + (row - BOARD_SIZE / 2) * hexR * 0.86;
        const cy = center + (row - BOARD_SIZE / 2) * hexR * 1.5;
        const key = `${row},${col}`;
        const owner = board[key];

        // Draw Cell
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = cx + hexR * Math.cos(angle);
          const py = cy + hexR * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = owner ? (owner === 'gold' ? '#997A00' : '#007A99') : '#331E12';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.stroke();

        // Draw 3D Stone on top
        if (owner) {
          const isGold = owner === 'gold';
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(cx + 2, cy + 2.5, hexR * 0.7, 0, Math.PI * 2);
          ctx.fill();

          // Body
          const grad = ctx.createRadialGradient(cx - hexR * 0.2, cy - hexR * 0.2, hexR * 0.1, cx, cy, hexR * 0.7);
          if (isGold) {
            grad.addColorStop(0, '#FFF4B3');
            grad.addColorStop(0.5, '#FFD700');
            grad.addColorStop(1, '#805E00');
          } else {
            grad.addColorStop(0, '#B3F5FF');
            grad.addColorStop(0.5, '#00E5FF');
            grad.addColorStop(1, '#007080');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, hexR * 0.68, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.beginPath();
          ctx.arc(cx - hexR * 0.2, cy - hexR * 0.2, hexR * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initHex);

})();
