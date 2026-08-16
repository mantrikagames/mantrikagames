/**
 * surakarta-3d.js — Handcrafted 3D Surakarta Loop Strategy Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const GRID_SIZE = 6;
  let board = [];
  let currentPlayer = 'gold'; // 'gold' (Rows 0-1) or 'ruby' (Rows 4-5)
  let selectedCell = null;
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;
  let moveHistory = [];

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;

  function initSurakarta() {
    canvas = document.getElementById('surakarta-canvas');
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
    // Initial setup: Gold in rows 0,1; Ruby in rows 4,5
    for (let c = 0; c < 6; c++) {
      board[0][c] = 'gold';
      board[1][c] = 'gold';
      board[4][c] = 'ruby';
      board[5][c] = 'ruby';
    }

    currentPlayer = 'gold';
    selectedCell = null;
    gameOver = false;
    moveHistory = [];
    updateHUD('Gold to select a piece');
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'ruby') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const pad = size * 0.15;
    const step = (size - pad * 2) / 5;

    const c = Math.round((x - pad) / step);
    const r = Math.round((y - pad) / step);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      if (selectedCell) {
        if (selectedCell.r === r && selectedCell.c === c) {
          selectedCell = null;
          render();
          return;
        }

        const dr = Math.abs(r - selectedCell.r);
        const dc = Math.abs(c - selectedCell.c);
        const isAdjacent = (dr <= 1 && dc <= 1) && (dr + dc > 0);

        if (isAdjacent && board[r][c] === null) {
          executeMove(selectedCell.r, selectedCell.c, r, c);
          selectedCell = null;
          return;
        }
      }

      if (board[r][c] === currentPlayer) {
        selectedCell = { r, c };
        render();
      }
    }
  }

  function executeMove(fromR, fromC, toR, toC) {
    board[toR][toC] = currentPlayer;
    board[fromR][fromC] = null;
    moveHistory.push({ fromR, fromC, toR, toC, player: currentPlayer });

    const scores = getScores();
    if (scores.gold === 0 || scores.ruby === 0) {
      gameOver = true;
      const winner = scores.gold > scores.ruby ? 'GOLD' : 'RUBY';
      updateHUD(`🎉 GAME OVER — ${winner} WINS SURAKARTA!`);
      render();
      return;
    }

    currentPlayer = currentPlayer === 'gold' ? 'ruby' : 'gold';
    updateHUD(`${currentPlayer.toUpperCase()}'s turn | Gold: ${scores.gold} • Ruby: ${scores.ruby}`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'ruby' && !gameOver) {
      setTimeout(makeAIMove, 450);
    }
  }

  function getScores() {
    let gold = 0, ruby = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 'gold') gold++;
        else if (board[r][c] === 'ruby') ruby++;
      }
    }
    return { gold, ruby };
  }

  function makeAIMove() {
    if (gameOver) return;
    let validMoves = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 'ruby') {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const tr = r + dr;
              const tc = c + dc;
              if ((dr !== 0 || dc !== 0) && tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
                if (board[tr][tc] === null) {
                  validMoves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
                }
              }
            }
          }
        }
      }
    }

    if (validMoves.length === 0) return;

    // Pick move towards row 0 (Gold territory)
    validMoves.sort((a, b) => a.toR - b.toR);
    const choice = validMoves[0];
    executeMove(choice.fromR, choice.fromC, choice.toR, choice.toC);
  }

  function updateHUD(msg) {
    if (hudMessage) hudMessage.textContent = msg;
    const scores = getScores();
    if (turnNameText) turnNameText.textContent = `${currentPlayer.toUpperCase()} (G:${scores.gold} R:${scores.ruby})`;
    if (turnNameDot) {
      turnNameDot.style.background = currentPlayer === 'gold' ? '#FFD700' : '#FF3366';
      turnNameDot.style.border = '1px solid #FFF';
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

    const pad = size * 0.15;
    const step = (size - pad * 2) / 5;

    // Grid Lines & Corner Loops
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.75)';
    ctx.lineWidth = 1.5;

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

    // Render Pieces
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] !== null) {
          const x = pad + c * step;
          const y = pad + r * step;
          const isGold = board[r][c] === 'gold';
          const radius = step * 0.36;

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(x + 2, y + 3, radius, 0, Math.PI * 2);
          ctx.fill();

          // Side Thickness
          ctx.fillStyle = isGold ? '#805E00' : '#80001A';
          ctx.beginPath();
          ctx.arc(x, y + 1.4, radius, 0, Math.PI * 2);
          ctx.fill();

          // Body
          const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          if (isGold) {
            grad.addColorStop(0, '#FFF4B3');
            grad.addColorStop(0.5, '#FFD700');
            grad.addColorStop(1, '#997A00');
          } else {
            grad.addColorStop(0, '#FFB3C6');
            grad.addColorStop(0.5, '#FF3366');
            grad.addColorStop(1, '#990026');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.95, 0, Math.PI * 2);
          ctx.fill();

          // Selection Ring
          if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Specular Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.beginPath();
          ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initSurakarta);

})();
