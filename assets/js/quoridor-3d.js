/**
 * quoridor-3d.js — Handcrafted 3D Quoridor Maze Game Engine
 * Mantrika Games
 */

(function () {
  'use strict';

  const GRID_SIZE = 9;
  let p1Pos = { r: 8, c: 4 }; // Gold (Bottom -> Top row 0)
  let p2Pos = { r: 0, c: 4 }; // Ivory (Top -> Bottom row 8)
  let currentPlayer = 'gold'; // 'gold' or 'ivory'
  let walls = []; // { r, c, isHorizontal, player }
  let remainingWalls = { gold: 10, ivory: 10 };
  let activeTool = 'move'; // 'move' or 'wall'
  let isWallHorizontal = true;
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let gameOver = false;
  let hoverWall = null; // { r, c, isHorizontal, isValid }

  let canvas, ctx;
  let hudMessage, turnNameDot, turnNameText;
  let toolMoveBtn, toolWallBtn, wallOrientLabel;

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

    toolMoveBtn = document.getElementById('tool-move-btn');
    toolWallBtn = document.getElementById('tool-wall-btn');
    wallOrientLabel = document.getElementById('wall-orient-label');

    if (toolMoveBtn) {
      toolMoveBtn.addEventListener('click', () => {
        activeTool = 'move';
        hoverWall = null;
        updateToolUI();
        updateHUD(`${currentPlayer.toUpperCase()}: Click a valid adjacent square to move pawn`);
        render();
      });
    }

    if (toolWallBtn) {
      toolWallBtn.addEventListener('click', () => {
        if (activeTool === 'wall') {
          // Toggle orientation
          isWallHorizontal = !isWallHorizontal;
        } else {
          activeTool = 'wall';
        }
        hoverWall = null;
        updateToolUI();
        updateHUD(`${currentPlayer.toUpperCase()}: Click groove to place ${isWallHorizontal ? 'Horizontal' : 'Vertical'} wall (${remainingWalls[currentPlayer]} left)`);
        render();
      });
    }

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
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseleave', () => {
      hoverWall = null;
      render();
    });
  }

  function updateToolUI() {
    if (toolMoveBtn && toolWallBtn) {
      if (activeTool === 'move') {
        toolMoveBtn.classList.add('btn-primary');
        toolMoveBtn.classList.remove('btn-outline');
        toolWallBtn.classList.add('btn-outline');
        toolWallBtn.classList.remove('btn-primary');
      } else {
        toolWallBtn.classList.add('btn-primary');
        toolWallBtn.classList.remove('btn-outline');
        toolMoveBtn.classList.add('btn-outline');
        toolMoveBtn.classList.remove('btn-primary');
      }
    }
    if (wallOrientLabel) {
      wallOrientLabel.textContent = isWallHorizontal ? '━ Horiz' : '┃ Vert';
    }
  }

  function resetBoard() {
    p1Pos = { r: 8, c: 4 };
    p2Pos = { r: 0, c: 4 };
    currentPlayer = 'gold';
    walls = [];
    remainingWalls = { gold: 10, ivory: 10 };
    activeTool = 'move';
    isWallHorizontal = true;
    gameOver = false;
    hoverWall = null;
    updateToolUI();
    updateHUD('Gold to move pawn');
    render();
  }

  // --- Board Coordinate Helpers ---
  function getBoardMetrics() {
    const size = canvas.width / (window.devicePixelRatio || 1);
    const pad = size * 0.07;
    const grooveW = size * 0.018;
    const totalCellSpace = size - pad * 2 - grooveW * (GRID_SIZE - 1);
    const cellSize = totalCellSpace / GRID_SIZE;
    return { size, pad, grooveW, cellSize };
  }

  function cellToPixel(r, c) {
    const { pad, grooveW, cellSize } = getBoardMetrics();
    const x = pad + c * (cellSize + grooveW);
    const y = pad + r * (cellSize + grooveW);
    return { x, y, w: cellSize, h: cellSize };
  }

  // --- Wall & Movement Validation ---
  function isWallBlocked(r1, c1, r2, c2, wallList = walls) {
    if (r1 === r2) {
      // Horizontal step across column groove
      const minC = Math.min(c1, c2);
      const row = r1;
      // Check if vertical wall exists at (row, minC) or (row-1, minC)
      return wallList.some(w => !w.isHorizontal && w.c === minC && (w.r === row || w.r === row - 1));
    } else if (c1 === c2) {
      // Vertical step across row groove
      const minR = Math.min(r1, r2);
      const col = c1;
      // Check if horizontal wall exists at (minR, col) or (minR, col-1)
      return wallList.some(w => w.isHorizontal && w.r === minR && (w.c === col || w.c === col - 1));
    }
    return false;
  }

  function getLegalPawnMoves(player, currentP1 = p1Pos, currentP2 = p2Pos, wallList = walls) {
    const myPos = player === 'gold' ? currentP1 : currentP2;
    const oppPos = player === 'gold' ? currentP2 : currentP1;
    const moves = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let [dr, dc] of dirs) {
      const nr = myPos.r + dr;
      const nc = myPos.c + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;

      if (isWallBlocked(myPos.r, myPos.c, nr, nc, wallList)) continue;

      if (nr === oppPos.r && nc === oppPos.c) {
        // Opponent in front — check jump
        const jumpR = nr + dr;
        const jumpC = nc + dc;
        let canStraightJump = jumpR >= 0 && jumpR < GRID_SIZE && jumpC >= 0 && jumpC < GRID_SIZE && !isWallBlocked(nr, nc, jumpR, jumpC, wallList);

        if (canStraightJump) {
          moves.push({ r: jumpR, c: jumpC });
        } else {
          // Diagonal jump options when straight jump is blocked
          const sideDirs = dr === 0 ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
          for (let [sdr, sdc] of sideDirs) {
            const sideR = nr + sdr;
            const sideC = nc + sdc;
            if (sideR >= 0 && sideR < GRID_SIZE && sideC >= 0 && sideC < GRID_SIZE) {
              if (!isWallBlocked(nr, nc, sideR, sideC, wallList)) {
                moves.push({ r: sideR, c: sideC });
              }
            }
          }
        }
      } else {
        moves.push({ r: nr, c: nc });
      }
    }
    return moves;
  }

  function isValidWallPlacement(r, c, isHorizontal, currentWalls = walls, p1 = p1Pos, p2 = p2Pos) {
    if (r < 0 || r >= GRID_SIZE - 1 || c < 0 || c >= GRID_SIZE - 1) return false;

    // Check overlap
    for (let w of currentWalls) {
      if (w.r === r && w.c === c) return false; // Exact intersection overlap
      if (isHorizontal && w.isHorizontal && w.r === r && Math.abs(w.c - c) <= 1) return false; // Horizontal overlap
      if (!isHorizontal && !w.isHorizontal && w.c === c && Math.abs(w.r - r) <= 1) return false; // Vertical overlap
    }

    // Path reachability test (BFS) with simulated wall
    const testWalls = [...currentWalls, { r, c, isHorizontal }];
    const p1CanWin = hasPathToGoal('gold', p1, testWalls);
    const p2CanWin = hasPathToGoal('ivory', p2, testWalls);

    return p1CanWin && p2CanWin;
  }

  function hasPathToGoal(player, startPos, wallList) {
    const targetRow = player === 'gold' ? 0 : 8;
    const queue = [{ r: startPos.r, c: startPos.c }];
    const visited = new Set([`${startPos.r},${startPos.c}`]);

    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.r === targetRow) return true;

      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (let [dr, dc] of dirs) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && !isWallBlocked(cur.r, cur.c, nr, nc, wallList)) {
            visited.add(key);
            queue.push({ r: nr, c: nc });
          }
        }
      }
    }
    return false;
  }

  function getShortestPath(player, startPos, wallList) {
    const targetRow = player === 'gold' ? 0 : 8;
    const queue = [{ r: startPos.r, c: startPos.c, path: [] }];
    const visited = new Set([`${startPos.r},${startPos.c}`]);

    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.r === targetRow) return [...cur.path, { r: cur.r, c: cur.c }];

      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (let [dr, dc] of dirs) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && !isWallBlocked(cur.r, cur.c, nr, nc, wallList)) {
            visited.add(key);
            queue.push({ r: nr, c: nc, path: [...cur.path, { r: cur.r, c: cur.c }] });
          }
        }
      }
    }
    return null;
  }

  // --- Interaction ---
  function handleCanvasMouseMove(e) {
    if (gameOver || (gameMode === 'ai' && currentPlayer === 'ivory')) return;
    if (activeTool !== 'wall' || remainingWalls[currentPlayer] <= 0) {
      hoverWall = null;
      render();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { pad, grooveW, cellSize } = getBoardMetrics();

    // Determine nearest groove intersection (0 to 7)
    const totalStep = cellSize + grooveW;
    const approxC = (x - pad - cellSize / 2) / totalStep;
    const approxR = (y - pad - cellSize / 2) / totalStep;

    const c = Math.round(approxC);
    const r = Math.round(approxR);

    if (r >= 0 && r < GRID_SIZE - 1 && c >= 0 && c < GRID_SIZE - 1) {
      const isValid = isValidWallPlacement(r, c, isWallHorizontal);
      hoverWall = { r, c, isHorizontal: isWallHorizontal, isValid };
    } else {
      hoverWall = null;
    }
    render();
  }

  function handleCanvasClick(e) {
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'ivory') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { pad, grooveW, cellSize } = getBoardMetrics();
    const totalStep = cellSize + grooveW;

    if (activeTool === 'wall') {
      if (remainingWalls[currentPlayer] <= 0) {
        updateHUD('No walls remaining for ' + currentPlayer.toUpperCase() + '! Select Move mode.');
        return;
      }

      const approxC = (x - pad - cellSize / 2) / totalStep;
      const approxR = (y - pad - cellSize / 2) / totalStep;
      const c = Math.round(approxC);
      const r = Math.round(approxR);

      if (r >= 0 && r < GRID_SIZE - 1 && c >= 0 && c < GRID_SIZE - 1) {
        if (isValidWallPlacement(r, c, isWallHorizontal)) {
          placeWall(r, c, isWallHorizontal, currentPlayer);
          return;
        } else {
          updateHUD('⚠️ Invalid wall placement (blocked or cuts off goal path!)');
          return;
        }
      }
    }

    // Pawn movement mode
    const c = Math.floor((x - pad) / totalStep);
    const r = Math.floor((y - pad) / totalStep);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const legalMoves = getLegalPawnMoves(currentPlayer);
      const move = legalMoves.find(m => m.r === r && m.c === c);

      if (move) {
        executePawnMove(move.r, move.c, currentPlayer);
      }
    }
  }

  function executePawnMove(r, c, player) {
    if (player === 'gold') p1Pos = { r, c };
    else p2Pos = { r, c };

    if (player === 'gold' && r === 0) {
      gameOver = true;
      updateHUD('🎉 GOLD WINS THE RACE TO THE BASELINE!');
      render();
      return;
    } else if (player === 'ivory' && r === 8) {
      gameOver = true;
      updateHUD('🎉 IVORY WINS THE RACE TO THE BASELINE!');
      render();
      return;
    }

    passTurn();
  }

  function placeWall(r, c, isHorizontal, player) {
    walls.push({ r, c, isHorizontal, player });
    remainingWalls[player]--;
    hoverWall = null;

    passTurn();
  }

  function passTurn() {
    currentPlayer = currentPlayer === 'gold' ? 'ivory' : 'gold';
    updateHUD(`${currentPlayer.toUpperCase()}'s turn | Gold Walls: ${remainingWalls.gold} • Ivory Walls: ${remainingWalls.ivory}`);
    render();

    if (gameMode === 'ai' && currentPlayer === 'ivory' && !gameOver) {
      setTimeout(makeAIMove, 500);
    }
  }

  // --- AI Decision Engine ---
  function makeAIMove() {
    if (gameOver) return;

    const p2Path = getShortestPath('ivory', p2Pos, walls);
    const p1Path = getShortestPath('gold', p1Pos, walls);

    const p2Dist = p2Path ? p2Path.length : 99;
    const p1Dist = p1Path ? p1Path.length : 99;

    // If AI has walls and human is closer to winning, evaluate wall block
    if (remainingWalls.ivory > 0 && p1Dist <= p2Dist && aiDifficulty !== 'easy') {
      let bestWall = null;
      let maxHumanDist = p1Dist;

      // Scan potential wall placements near gold pawn
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const wr = p1Pos.r + dr;
          const wc = p1Pos.c + dc;
          for (let isH of [true, false]) {
            if (isValidWallPlacement(wr, wc, isH, walls, p1Pos, p2Pos)) {
              const testWalls = [...walls, { r: wr, c: wc, isHorizontal: isH }];
              const testP1 = getShortestPath('gold', p1Pos, testWalls);
              const testP2 = getShortestPath('ivory', p2Pos, testWalls);
              if (testP1 && testP2) {
                const newP1Dist = testP1.length;
                const newP2Dist = testP2.length;
                if (newP1Dist > maxHumanDist && newP2Dist <= p2Dist + 1) {
                  maxHumanDist = newP1Dist;
                  bestWall = { r: wr, c: wc, isHorizontal: isH };
                }
              }
            }
          }
        }
      }

      if (bestWall && (maxHumanDist > p1Dist || Math.random() < 0.3)) {
        placeWall(bestWall.r, bestWall.c, bestWall.isHorizontal, 'ivory');
        return;
      }
    }

    // Default: Advance pawn along shortest path
    if (p2Path && p2Path.length > 1) {
      const nextStep = p2Path[1];
      executePawnMove(nextStep.r, nextStep.c, 'ivory');
    } else {
      const legalMoves = getLegalPawnMoves('ivory');
      if (legalMoves.length > 0) {
        legalMoves.sort((a, b) => b.r - a.r); // Prioritize moving down towards row 8
        executePawnMove(legalMoves[0].r, legalMoves[0].c, 'ivory');
      }
    }
  }

  function updateHUD(msg) {
    if (hudMessage) hudMessage.textContent = msg;
    if (turnNameText) turnNameText.textContent = `${currentPlayer.toUpperCase()} (W:${remainingWalls[currentPlayer]})`;
    if (turnNameDot) {
      turnNameDot.style.background = currentPlayer === 'gold' ? '#FFD700' : '#FAF8F3';
      turnNameDot.style.border = '1px solid #FFF';
    }
  }

  // --- Rendering Engine ---
  function render() {
    if (!canvas || !ctx) return;
    const { size, pad, grooveW, cellSize } = getBoardMetrics();
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

    // Recessed Grooves Underlay
    ctx.fillStyle = '#170E08';
    ctx.fillRect(pad - 2, pad - 2, size - pad * 2 + 4, size - pad * 2 + 4);

    // Render Grid Cells
    const totalStep = cellSize + grooveW;
    const legalMoves = (currentPlayer === 'gold' || gameMode === 'local') ? getLegalPawnMoves(currentPlayer) : [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const { x, y, w, h } = cellToPixel(r, c);

        // Cell base
        const cellGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        cellGrad.addColorStop(0, '#382215');
        cellGrad.addColorStop(1, '#24140B');
        ctx.fillStyle = cellGrad;
        ctx.fillRect(x, y, w, h);

        // Highlight legal move cells
        if (activeTool === 'move' && !gameOver) {
          const isLegal = legalMoves.some(m => m.r === r && m.c === c);
          if (isLegal) {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
          }
        }
      }
    }

    // Baseline Goal Accents
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad - 3, size - pad * 2, 2); // Row 0 target for Gold
    ctx.strokeStyle = '#FAF8F3';
    ctx.strokeRect(pad, size - pad + 1, size - pad * 2, 2); // Row 8 target for Ivory

    // Render Placed Walls
    walls.forEach(w => {
      drawWall(w.r, w.c, w.isHorizontal, w.player === 'gold' ? '#D4AF37' : '#E5E0D8');
    });

    // Render Hover Wall Preview
    if (hoverWall && activeTool === 'wall' && !gameOver) {
      const color = hoverWall.isValid ? 'rgba(74, 222, 128, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      drawWall(hoverWall.r, hoverWall.c, hoverWall.isHorizontal, color, true);
    }

    // Render Pawns
    const p1Cell = cellToPixel(p1Pos.r, p1Pos.c);
    const p2Cell = cellToPixel(p2Pos.r, p2Pos.c);
    drawPawn(ctx, p1Cell.x + p1Cell.w / 2, p1Cell.y + p1Cell.h / 2, cellSize * 0.38, true);
    drawPawn(ctx, p2Cell.x + p2Cell.w / 2, p2Cell.y + p2Cell.h / 2, cellSize * 0.38, false);
  }

  function drawWall(r, c, isHorizontal, color, isPreview = false) {
    const { pad, grooveW, cellSize } = getBoardMetrics();
    const totalStep = cellSize + grooveW;

    let wx, wy, ww, wh;
    if (isHorizontal) {
      wx = pad + c * totalStep;
      wy = pad + (r + 1) * totalStep - grooveW;
      ww = cellSize * 2 + grooveW;
      wh = grooveW;
    } else {
      wx = pad + (c + 1) * totalStep - grooveW;
      wy = pad + r * totalStep;
      ww = grooveW;
      wh = cellSize * 2 + grooveW;
    }

    ctx.save();
    if (!isPreview) {
      // Wall Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(wx + 2, wy + 2, ww, wh);
    }

    // Wall Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 2);
    ctx.fill();

    if (!isPreview) {
      // Wood Texture / Brass Rivets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);
    }
    ctx.restore();
  }

  function drawPawn(ctx, x, y, r, isGold) {
    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x + 2.5, y + 3.5, r, 0, Math.PI * 2);
    ctx.fill();

    // Side Thickness
    ctx.fillStyle = isGold ? '#805E00' : '#A89E8D';
    ctx.beginPath();
    ctx.arc(x, y + 1.8, r, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    if (isGold) {
      grad.addColorStop(0, '#FFF4B3');
      grad.addColorStop(0.45, '#FFD700');
      grad.addColorStop(1, '#805E00');
    } else {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.45, '#F7F3E9');
      grad.addColorStop(1, '#B8AA94');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Lathe Collar Ring
    ctx.strokeStyle = isGold ? 'rgba(255, 255, 255, 0.7)' : 'rgba(160, 140, 115, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    // Specular Highlight
    ctx.fillStyle = isGold ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Export engine for verification / headless testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      isWallBlocked,
      getLegalPawnMoves,
      isValidWallPlacement,
      hasPathToGoal,
      getShortestPath
    };
  }

  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initQuoridor);
  }
})();
