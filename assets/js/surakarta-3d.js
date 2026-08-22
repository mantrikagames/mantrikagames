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
  let validMovesForSelected = []; // [{ r, c, isCapture, path }]
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;
  let moveHistory = [];
  let activeCaptureAnimation = null; // { path, startTime }

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
    validMovesForSelected = [];
    gameOver = false;
    moveHistory = [];
    activeCaptureAnimation = null;
    updateHUD('Gold to select a piece (moves 1 step or captures via corner loops)');
    render();
  }

  // --- Surakarta Corner Loop Path Tracer ---
  /**
   * Corner Loop mapping table:
   * Key: `${r},${c},${dr},${dc}` (exiting cell moving out of board)
   * Value: { nextR, nextC, nextDr, nextDc, corner: 'TL'|'TR'|'BL'|'BR', loopIdx: 1|2 }
   */
  function getLoopTransition(r, c, dr, dc) {
    // Top-Left: rows 1,2 exiting left (c=-1) -> cols 1,2 entering from top (r=0, dr=1, dc=0)
    if (c === 0 && dc === -1) {
      if (r === 1) return { nextR: 0, nextC: 1, nextDr: 1, nextDc: 0, corner: 'TL', radius: 1 };
      if (r === 2) return { nextR: 0, nextC: 2, nextDr: 1, nextDc: 0, corner: 'TL', radius: 2 };
    }
    // Top-Left: cols 1,2 exiting top (r=-1) -> rows 1,2 entering from left (c=0, dr=0, dc=1)
    if (r === 0 && dr === -1) {
      if (c === 1) return { nextR: 1, nextC: 0, nextDr: 0, nextDc: 1, corner: 'TL', radius: 1 };
      if (c === 2) return { nextR: 2, nextC: 0, nextDr: 0, nextDc: 1, corner: 'TL', radius: 2 };
    }

    // Top-Right: rows 1,2 exiting right (c=6) -> cols 4,3 entering from top (r=0, dr=1, dc=0)
    if (c === 5 && dc === 1) {
      if (r === 1) return { nextR: 0, nextC: 4, nextDr: 1, nextDc: 0, corner: 'TR', radius: 1 };
      if (r === 2) return { nextR: 0, nextC: 3, nextDr: 1, nextDc: 0, corner: 'TR', radius: 2 };
    }
    // Top-Right: cols 4,3 exiting top (r=-1) -> rows 1,2 entering from right (c=5, dr=0, dc=-1)
    if (r === 0 && dr === -1) {
      if (c === 4) return { nextR: 1, nextC: 5, nextDr: 0, nextDc: -1, corner: 'TR', radius: 1 };
      if (c === 3) return { nextR: 2, nextC: 5, nextDr: 0, nextDc: -1, corner: 'TR', radius: 2 };
    }

    // Bottom-Left: rows 4,3 exiting left (c=-1) -> cols 1,2 entering from bottom (r=5, dr=-1, dc=0)
    if (c === 0 && dc === -1) {
      if (r === 4) return { nextR: 5, nextC: 1, nextDr: -1, nextDc: 0, corner: 'BL', radius: 1 };
      if (r === 3) return { nextR: 5, nextC: 2, nextDr: -1, nextDc: 0, corner: 'BL', radius: 2 };
    }
    // Bottom-Left: cols 1,2 exiting bottom (r=6) -> rows 4,3 entering from left (c=0, dr=0, dc=1)
    if (r === 5 && dr === 1) {
      if (c === 1) return { nextR: 4, nextC: 0, nextDr: 0, nextDc: 1, corner: 'BL', radius: 1 };
      if (c === 2) return { nextR: 3, nextC: 0, nextDr: 0, nextDc: 1, corner: 'BL', radius: 2 };
    }

    // Bottom-Right: rows 4,3 exiting right (c=6) -> cols 4,3 entering from bottom (r=5, dr=-1, dc=0)
    if (c === 5 && dc === 1) {
      if (r === 4) return { nextR: 5, nextC: 4, nextDr: -1, nextDc: 0, corner: 'BR', radius: 1 };
      if (r === 3) return { nextR: 5, nextC: 3, nextDr: -1, nextDc: 0, corner: 'BR', radius: 2 };
    }
    // Bottom-Right: cols 4,3 exiting bottom (r=6) -> rows 4,3 entering from right (c=5, dr=0, dc=-1)
    if (r === 5 && dr === 1) {
      if (c === 4) return { nextR: 4, nextC: 5, nextDr: 0, nextDc: -1, corner: 'BR', radius: 1 };
      if (c === 3) return { nextR: 3, nextC: 5, nextDr: 0, nextDc: -1, corner: 'BR', radius: 2 };
    }

    return null; // Dead end (lines 0 & 5 have no loops)
  }

  function getLegalMovesForPiece(startR, startC, currentBoard = board) {
    const piece = currentBoard[startR][startC];
    if (!piece) return [];
    const opp = piece === 'gold' ? 'ruby' : 'gold';
    const moves = [];

    // 1. Non-capturing Adjacent Moves (1 step in 8 directions)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const tr = startR + dr;
        const tc = startC + dc;
        if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
          if (currentBoard[tr][tc] === null) {
            moves.push({ r: tr, c: tc, isCapture: false, path: [{ r: startR, c: startC }, { r: tr, c: tc }] });
          }
        }
      }
    }

    // 2. Loop Captures (Orthogonal 4 directions via corner loops)
    const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let [initialDr, initialDc] of orthoDirs) {
      let curR = startR;
      let curC = startC;
      let curDr = initialDr;
      let curDc = initialDc;
      let loopsTraversed = 0;
      let visitedTransitions = new Set();
      let path = [{ r: startR, c: startC }];

      while (true) {
        const nextR = curR + curDr;
        const nextC = curC + curDc;

        if (nextR >= 0 && nextR < GRID_SIZE && nextC >= 0 && nextC < GRID_SIZE) {
          // Inside board
          curR = nextR;
          curC = nextC;
          path.push({ r: curR, c: curC });

          if (curR === startR && curC === startC) {
            // Looped all the way back to self
            break;
          }

          const cellVal = currentBoard[curR][curC];
          if (cellVal === piece) {
            // Blocked by friendly piece
            break;
          } else if (cellVal === opp) {
            // Hit opponent piece!
            if (loopsTraversed >= 1) {
              moves.push({ r: curR, c: curC, isCapture: true, loops: loopsTraversed, path });
            }
            break;
          }
          // Empty cell: continue along ray
        } else {
          // Exiting board edge — attempt corner loop transition
          const trans = getLoopTransition(curR, curC, curDr, curDc);
          if (!trans) break; // Dead end (no loop on this line)

          const transKey = `${curR},${curC},${curDr},${curDc}`;
          if (visitedTransitions.has(transKey)) break; // Cycle prevention
          visitedTransitions.add(transKey);

          loopsTraversed++;
          curR = trans.nextR;
          curC = trans.nextC;
          curDr = trans.nextDr;
          curDc = trans.nextDc;
          path.push({ r: curR, c: curC, isLoopArc: true, corner: trans.corner, radius: trans.radius });

          const cellVal = currentBoard[curR][curC];
          if (cellVal === piece) {
            break;
          } else if (cellVal === opp) {
            moves.push({ r: curR, c: curC, isCapture: true, loops: loopsTraversed, path });
            break;
          }
        }
      }
    }

    return moves;
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'ruby') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = rect.width;
    const pad = size * 0.16;
    const step = (size - pad * 2) / 5;

    const c = Math.round((x - pad) / step);
    const r = Math.round((y - pad) / step);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      if (selectedCell) {
        if (selectedCell.r === r && selectedCell.c === c) {
          selectedCell = null;
          validMovesForSelected = [];
          render();
          return;
        }

        const chosenMove = validMovesForSelected.find(m => m.r === r && m.c === c);
        if (chosenMove) {
          executeMove(selectedCell.r, selectedCell.c, r, c, chosenMove);
          selectedCell = null;
          validMovesForSelected = [];
          return;
        }
      }

      if (board[r][c] === currentPlayer) {
        selectedCell = { r, c };
        validMovesForSelected = getLegalMovesForPiece(r, c, board);
        const capturesCount = validMovesForSelected.filter(m => m.isCapture).length;
        if (capturesCount > 0) {
          updateHUD(`Piece selected: ${capturesCount} loop capture(s) available! Click target.`);
        } else {
          updateHUD(`Piece selected: Click adjacent node to step.`);
        }
        render();
      }
    }
  }

  function executeMove(fromR, fromC, toR, toC, moveData) {
    const isCap = moveData ? moveData.isCapture : false;
    board[toR][toC] = currentPlayer;
    board[fromR][fromC] = null;
    moveHistory.push({ fromR, fromC, toR, toC, player: currentPlayer, isCapture: isCap });

    const scores = getScores();
    if (scores.gold === 0 || scores.ruby === 0) {
      gameOver = true;
      const winner = scores.gold > scores.ruby ? 'GOLD' : 'RUBY';
      updateHUD(`🎉 GAME OVER — ${winner} WINS SURAKARTA! (${scores.gold} vs ${scores.ruby})`);
      render();
      return;
    }

    currentPlayer = currentPlayer === 'gold' ? 'ruby' : 'gold';
    updateHUD(`${currentPlayer.toUpperCase()}'s turn | Gold: ${scores.gold} • Ruby: ${scores.ruby}${isCap ? ' (Captured opponent!)' : ''}`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'ruby' && !gameOver) {
      setTimeout(makeAIMove, 500);
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

    let allMoves = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 'ruby') {
          const pieceMoves = getLegalMovesForPiece(r, c, board);
          pieceMoves.forEach(m => {
            allMoves.push({ fromR: r, fromC: c, toR: m.r, toC: m.c, moveData: m });
          });
        }
      }
    }

    if (allMoves.length === 0) return;

    // AI Priority: 1. Loop captures, 2. Moving toward Gold side / center control
    const captures = allMoves.filter(m => m.moveData.isCapture);
    if (captures.length > 0) {
      // Pick capture with most loops or highest tactical value
      captures.sort((a, b) => (b.moveData.loops || 0) - (a.moveData.loops || 0));
      const choice = captures[0];
      executeMove(choice.fromR, choice.fromC, choice.toR, choice.toC, choice.moveData);
      return;
    }

    // Normal move: advance forward toward row 0
    allMoves.sort((a, b) => a.toR - b.toR);
    const choice = allMoves[0];
    executeMove(choice.fromR, choice.fromC, choice.toR, choice.toC, choice.moveData);
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

    const pad = size * 0.16;
    const step = (size - pad * 2) / 5;

    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.75)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(pad + i * step, pad); ctx.lineTo(pad + i * step, size - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + i * step); ctx.lineTo(size - pad, pad + i * step); ctx.stroke();
    }

    // Diagonals across inner squares
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(size - pad, size - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(size - pad, pad); ctx.lineTo(pad, size - pad); ctx.stroke();

    // 8 Corner Loops
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;

    // Top-Left corner loops
    drawCornerLoop(ctx, pad, pad, step * 1, -Math.PI * 0.5, Math.PI);
    drawCornerLoop(ctx, pad, pad, step * 2, -Math.PI * 0.5, Math.PI);

    // Top-Right corner loops
    drawCornerLoop(ctx, size - pad, pad, step * 1, 0, Math.PI * 1.5);
    drawCornerLoop(ctx, size - pad, pad, step * 2, 0, Math.PI * 1.5);

    // Bottom-Left corner loops
    drawCornerLoop(ctx, pad, size - pad, step * 1, Math.PI * 0.5, Math.PI * 2);
    drawCornerLoop(ctx, pad, size - pad, step * 2, Math.PI * 0.5, Math.PI * 2);

    // Bottom-Right corner loops
    drawCornerLoop(ctx, size - pad, size - pad, step * 1, 0, Math.PI * 0.5, true);
    drawCornerLoop(ctx, size - pad, size - pad, step * 2, 0, Math.PI * 0.5, true);

    // Render Valid Move Indicators
    if (selectedCell && validMovesForSelected.length > 0) {
      validMovesForSelected.forEach(m => {
        const mx = pad + m.c * step;
        const my = pad + m.r * step;

        ctx.save();
        if (m.isCapture) {
          // Red strike halo for loop captures
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(mx, my, step * 0.42, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(mx, my, step * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Gold halo for normal steps
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mx, my, step * 0.35, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(mx, my, step * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Render Pieces
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = board[r][c];
        if (val) {
          const isSel = selectedCell && selectedCell.r === r && selectedCell.c === c;
          drawPiece(ctx, pad + c * step, pad + r * step, step * 0.36, val === 'gold', isSel);
        }
      }
    }
  }

  function drawCornerLoop(ctx, cx, cy, radius, startAngle, endAngle, isBottomRight = false) {
    ctx.beginPath();
    if (isBottomRight) {
      ctx.arc(cx, cy, radius, Math.PI, Math.PI * 1.5);
    } else {
      ctx.arc(cx, cy, radius, startAngle, endAngle);
    }
    ctx.stroke();
  }

  function drawPiece(ctx, x, y, r, isGold, isSelected) {
    ctx.save();
    // Selection glow
    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(x + 2.5, y + 3.5, r, 0, Math.PI * 2);
    ctx.fill();

    // Side Thickness
    ctx.fillStyle = isGold ? '#805E00' : '#880E28';
    ctx.beginPath();
    ctx.arc(x, y + 1.8, r, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    if (isGold) {
      grad.addColorStop(0, '#FFF4B3');
      grad.addColorStop(0.45, '#FFD700');
      grad.addColorStop(1, '#805E00');
    } else {
      grad.addColorStop(0, '#FFA8C5');
      grad.addColorStop(0.45, '#E11D48');
      grad.addColorStop(1, '#66051B');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Inner Ring
    ctx.strokeStyle = isGold ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 200, 220, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Export engine for verification / testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getLoopTransition,
      getLegalMovesForPiece,
      GRID_SIZE
    };
  }

  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initSurakarta);
  }
})();
