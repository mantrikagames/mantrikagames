/**
 * ataxx-3d.js — Handcrafted 3D Ataxx Infection Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const GRID_SIZE = 7;
  let board = [];
  let currentPlayer = 'gold'; // 'gold' (P1) or 'ruby' (P2/AI)
  let selectedCell = null; // { r, c }
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;

  function initAtaxx() {
    canvas = document.getElementById('ataxx-canvas');
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
    board[0][0] = 'gold';
    board[6][6] = 'gold';
    board[0][6] = 'ruby';
    board[6][0] = 'ruby';

    currentPlayer = 'gold';
    selectedCell = null;
    gameOver = false;
    updateHUD('Gold to select a token');
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'ruby') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const pad = size * 0.08;
    const cellSize = (size - pad * 2) / GRID_SIZE;

    const c = Math.floor((x - pad) / cellSize);
    const r = Math.floor((y - pad) / cellSize);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      if (selectedCell) {
        if (selectedCell.r === r && selectedCell.c === c) {
          selectedCell = null;
          render();
          return;
        }

        const dist = Math.max(Math.abs(r - selectedCell.r), Math.abs(c - selectedCell.c));
        if (dist === 1 || dist === 2) {
          if (board[r][c] === null) {
            executeMove(selectedCell.r, selectedCell.c, r, c, dist);
            selectedCell = null;
            return;
          }
        }
      }

      if (board[r][c] === currentPlayer) {
        selectedCell = { r, c };
        render();
      }
    }
  }

  function executeMove(fromR, fromC, toR, toC, dist) {
    if (dist === 1) {
      // Clone
      board[toR][toC] = currentPlayer;
    } else {
      // Jump
      board[fromR][fromC] = null;
      board[toR][toC] = currentPlayer;
    }

    // Infect neighbors
    const opp = currentPlayer === 'gold' ? 'ruby' : 'gold';
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = toR + dr;
        const nc = toC + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          if (board[nr][nc] === opp) {
            board[nr][nc] = currentPlayer;
          }
        }
      }
    }

    // Check game over
    const scores = getScores();
    if (scores.gold === 0 || scores.ruby === 0 || scores.empty === 0) {
      gameOver = true;
      let winMsg = scores.gold > scores.ruby ? 'GOLD WINS!' : (scores.ruby > scores.gold ? 'RUBY WINS!' : 'DRAW!');
      updateHUD(`🎉 GAME OVER — ${winMsg} (Gold: ${scores.gold} vs Ruby: ${scores.ruby})`);
      render();
      return;
    }

    currentPlayer = opp;
    updateHUD(`${currentPlayer.toUpperCase()}'s turn | Gold: ${scores.gold} • Ruby: ${scores.ruby}`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'ruby' && !gameOver) {
      setTimeout(makeAIMove, 450);
    }
  }

  function getScores() {
    let gold = 0, ruby = 0, empty = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 'gold') gold++;
        else if (board[r][c] === 'ruby') ruby++;
        else empty++;
      }
    }
    return { gold, ruby, empty };
  }

  function makeAIMove() {
    if (gameOver) return;
    let moves = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 'ruby') {
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const tr = r + dr;
              const tc = c + dc;
              const dist = Math.max(Math.abs(dr), Math.abs(dc));
              if (dist > 0 && dist <= 2 && tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
                if (board[tr][tc] === null) {
                  // Calculate potential conversions
                  let conversions = 0;
                  for (let nr = tr - 1; nr <= tr + 1; nr++) {
                    for (let nc = tc - 1; nc <= tc + 1; nc++) {
                      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc] === 'gold') {
                        conversions++;
                      }
                    }
                  }
                  moves.push({ fromR: r, fromC: c, toR: tr, toC: tc, dist, score: conversions + (dist === 1 ? 1 : 0) });
                }
              }
            }
          }
        }
      }
    }

    if (moves.length === 0) return;

    moves.sort((a, b) => b.score - a.score);
    const choice = moves[0];
    executeMove(choice.fromR, choice.fromC, choice.toR, choice.toC, choice.dist);
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

    // Recessed 7x7 Grid Cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = '#2A1F18';
        ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.strokeRect(pad + c * cellSize, pad + r * cellSize, cellSize, cellSize);

        // Highlight selected cell
        if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(pad + c * cellSize + 2, pad + r * cellSize + 2, cellSize - 4, cellSize - 4);
          ctx.lineWidth = 1;
        }

        // Highlight target cells
        if (selectedCell && board[r][c] === null) {
          const dist = Math.max(Math.abs(r - selectedCell.r), Math.abs(c - selectedCell.c));
          if (dist === 1) {
            // Clone = Emerald
            ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
            ctx.fillRect(pad + c * cellSize + 2, pad + r * cellSize + 2, cellSize - 4, cellSize - 4);
          } else if (dist === 2) {
            // Jump = Amber
            ctx.fillStyle = 'rgba(255, 145, 0, 0.25)';
            ctx.fillRect(pad + c * cellSize + 2, pad + r * cellSize + 2, cellSize - 4, cellSize - 4);
          }
        }
      }
    }

    // Render Tokens
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] !== null) {
          const x = pad + (c + 0.5) * cellSize;
          const y = pad + (r + 0.5) * cellSize;
          const isGold = board[r][c] === 'gold';

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(x + 2.5, y + 3.5, cellSize * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Side Thickness Rim
          ctx.fillStyle = isGold ? '#805E00' : '#80001A';
          ctx.beginPath();
          ctx.arc(x, y + 1.5, cellSize * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Dome Body
          const grad = ctx.createRadialGradient(x - cellSize * 0.12, y - cellSize * 0.12, cellSize * 0.05, x, y, cellSize * 0.38);
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
          ctx.arc(x, y, cellSize * 0.36, 0, Math.PI * 2);
          ctx.fill();

          // Specular Sheen
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.beginPath();
          ctx.arc(x - cellSize * 0.1, y - cellSize * 0.1, cellSize * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initAtaxx);

})();
