/**
 * ==============================================================================
 * Mantrika Games — Pretwa 3D (Bihar Circular Mandala) Engine
 * ==============================================================================
 */
(function() {
  'use strict';

  // 19 Node coordinates: Center (0) + 3 Rings of 6 nodes (1-6, 7-12, 13-18)
  const NODE_COORDS = [{ x: 0, z: 0 }]; // Node 0
  const RADII = [2.2, 4.4, 6.6];

  RADII.forEach(r => {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      NODE_COORDS.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r });
    }
  });

  // Build Adjacency Table
  function buildAdjacency() {
    const adj = {};
    for (let i = 0; i < 19; i++) adj[i] = [];

    // Center node 0 connects to all 6 inner ring nodes (1 to 6)
    for (let i = 1; i <= 6; i++) {
      adj[0].push(i);
      adj[i].push(0);
    }

    // Concentric ring circular connections
    const rings = [[1,2,3,4,5,6], [7,8,9,10,11,12], [13,14,15,16,17,18]];
    rings.forEach(ring => {
      for (let i = 0; i < 6; i++) {
        const u = ring[i];
        const v = ring[(i + 1) % 6];
        if (!adj[u].includes(v)) adj[u].push(v);
        if (!adj[v].includes(u)) adj[v].push(u);
      }
    });

    // Radial spoke connections across rings
    for (let i = 0; i < 6; i++) {
      const inner = 1 + i;
      const mid = 7 + i;
      const outer = 13 + i;
      if (!adj[inner].includes(mid)) adj[inner].push(mid);
      if (!adj[mid].includes(inner)) adj[mid].push(inner);
      if (!adj[mid].includes(outer)) adj[mid].push(outer);
      if (!adj[outer].includes(mid)) adj[outer].push(mid);
    }

    return adj;
  }

  const ADJACENCY = buildAdjacency();

  // Leap Jump Lines: [from, over, to]
  function buildJumpLines() {
    const jumps = [];

    // 1. Concentric Ring Jumps
    const rings = [[1,2,3,4,5,6], [7,8,9,10,11,12], [13,14,15,16,17,18]];
    rings.forEach(ring => {
      for (let i = 0; i < 6; i++) {
        const from = ring[i];
        const over = ring[(i + 1) % 6];
        const to = ring[(i + 2) % 6];
        jumps.push({ from, over, to });
        jumps.push({ from: to, over, to: from });
      }
    });

    // 2. Radial Spoke Jumps
    for (let i = 0; i < 6; i++) {
      const inner = 1 + i;
      const mid = 7 + i;
      const outer = 13 + i;
      const oppInner = 1 + ((i + 3) % 6);
      const oppMid = 7 + ((i + 3) % 6);

      // outer <-> mid <-> inner
      jumps.push({ from: outer, over: mid, to: inner });
      jumps.push({ from: inner, over: mid, to: outer });

      // mid <-> inner <-> center
      jumps.push({ from: mid, over: inner, to: 0 });
      jumps.push({ from: 0, over: inner, to: mid });

      // inner <-> center <-> oppInner
      jumps.push({ from: inner, over: 0, to: oppInner });
      jumps.push({ from: oppInner, over: 0, to: inner });

      // center <-> oppInner <-> oppMid
      jumps.push({ from: 0, over: oppInner, to: oppMid });
      jumps.push({ from: oppMid, over: oppInner, to: 0 });
    }

    return jumps;
  }

  const JUMP_LINES = buildJumpLines();

  class PretwaApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('pretwa-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.board = Array(19).fill(-1);
      this.turn = 0;
      this.selectedIdx = null;
      this.legalMoves = [];
      this.winner = -1;

      this.initLoadingSimulation();
    }

    initLoadingSimulation() {
      const progressFill = document.getElementById('loading-progress-fill');
      const progressPct = document.getElementById('loading-percentage');
      const overlay = document.getElementById('game-loading-overlay');
      const hud = document.getElementById('game-hud-overlay');

      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (progress > 100) progress = 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressPct) progressPct.textContent = `${progress}%`;
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            if (hud) hud.style.display = 'flex';
            this.initThree();
            this.initDOMControls();
          }, 300);
        }
      }, 50);
    }

    initThree() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x130F0D);

      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      this.camera.position.set(0, 18, 14);
      this.camera.lookAt(0, 0, 0);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Studio Lighting
      const ambient = new THREE.AmbientLight(0xFFE8D6, 0.75);
      this.scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xFFF2DC, 1.35);
      dirLight.position.set(10, 20, 12);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.bias = -0.0001;
      dirLight.shadow.radius = 2;
      this.scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x7A9EC2, 0.4);
      fillLight.position.set(-10, 12, -10);
      this.scene.add(fillLight);

      const rimLight = new THREE.SpotLight(0xD4AF37, 0.8);
      rimLight.position.set(0, 22, -15);
      rimLight.angle = Math.PI / 3;
      rimLight.penumbra = 0.8;
      this.scene.add(rimLight);

      // Dust particles
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = 80;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPos[i] = (Math.random() - 0.5) * 22;
        dustPos[i + 1] = Math.random() * 8 + 0.5;
        dustPos[i + 2] = (Math.random() - 0.5) * 22;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0xD4AF37,
        size: 0.15,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      this.dustParticles = new THREE.Points(dustGeo, dustMat);
      this.scene.add(this.dustParticles);

      this.buildBoard();
      this.buildPiecesGroup();
      this.buildHighlightGroup();
      this.setupInteraction();
      this.animate();
    }

    buildBoard() {
      this.boardGroup = new THREE.Group();

      // Board Base
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x2A180E, roughness: 0.35, metalness: 0.1 });
      const slab = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.4, 0.45, 48), woodMat);
      slab.position.y = -0.22;
      slab.receiveShadow = true;
      this.boardGroup.add(slab);

      // Gold Inlay Circles
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.2 });
      RADII.forEach(r => {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.04, r + 0.04, 64), brassMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.boardGroup.add(ring);
      });

      // 3 Radial Diameters (6 spokes)
      for (let i = 0; i < 3; i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.02, 0.06), brassMat);
        spoke.rotation.y = (i * Math.PI) / 3;
        spoke.position.y = 0.01;
        this.boardGroup.add(spoke);
      }

      // 19 Brass Inlay Node Wells
      NODE_COORDS.forEach((c) => {
        const well = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.08, 20), brassMat);
        well.position.set(c.x, 0.02, c.z);
        this.boardGroup.add(well);
      });

      this.scene.add(this.boardGroup);
    }

    buildPiecesGroup() {
      this.piecesGroup = new THREE.Group();
      this.scene.add(this.piecesGroup);
    }

    buildHighlightGroup() {
      this.highlightGroup = new THREE.Group();
      this.scene.add(this.highlightGroup);
    }

    updatePieces3D() {
      while (this.piecesGroup.children.length > 0) this.piecesGroup.remove(this.piecesGroup.children[0]);

      const lapisMat = new THREE.MeshStandardMaterial({ color: 0x1D4ED8, roughness: 0.25, metalness: 0.3 });
      const carnelianMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.25, metalness: 0.2 });

      this.board.forEach((val, idx) => {
        if (val === -1) return;
        const pos = NODE_COORDS[idx];
        const mat = val === 0 ? lapisMat : carnelianMat;
        const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.32, 20), mat);
        piece.position.set(pos.x, 0.18, pos.z);
        piece.userData = { idx, player: val };
        this.piecesGroup.add(piece);
      });

      this.updateHighlightMarkers();
    }

    updateHighlightMarkers() {
      while (this.highlightGroup.children.length > 0) this.highlightGroup.remove(this.highlightGroup.children[0]);

      if (this.selectedIdx !== null && this.legalMoves.length > 0) {
        this.legalMoves.forEach(m => {
          const pos = NODE_COORDS[m.to];
          const color = m.isJump ? 0xEF4444 : 0xFFD700;
          const marker = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.45, 24),
            new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
          );
          marker.rotation.x = -Math.PI / 2;
          marker.position.set(pos.x, 0.08, pos.z);
          this.highlightGroup.add(marker);
        });
      }
    }

    setupInteraction() {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      this.canvas.addEventListener('click', (e) => {
        if (this.winner !== -1 || (this.gameMode === 'ai' && this.turn === 1)) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hitPos = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(plane, hitPos)) {
          const nearest = this.getNearestNode(hitPos);
          if (nearest !== -1) {
            this.handleNodeClick(nearest);
          }
        }
      });
    }

    getNearestNode(pos) {
      let best = -1;
      let minD = 0.9;
      NODE_COORDS.forEach((c, idx) => {
        const d = Math.hypot(pos.x - c.x, pos.z - c.z);
        if (d < minD) {
          minD = d;
          best = idx;
        }
      });
      return best;
    }

    getLegalMovesForNode(nodeIdx, currentBoard = this.board, player = this.turn) {
      if (currentBoard[nodeIdx] !== player) return [];
      const opp = player === 0 ? 1 : 0;
      const moves = [];

      // 1. Standard 1-step moves to connected adjacent empty nodes
      const neighbors = ADJACENCY[nodeIdx] || [];
      neighbors.forEach(nbr => {
        if (currentBoard[nbr] === -1) {
          moves.push({ from: nodeIdx, to: nbr, isJump: false });
        }
      });

      // 2. Leap captures over opponent into empty node
      JUMP_LINES.forEach(jl => {
        if (jl.from === nodeIdx) {
          if (currentBoard[jl.over] === opp && currentBoard[jl.to] === -1) {
            moves.push({ from: nodeIdx, over: jl.over, to: jl.to, isJump: true });
          }
        }
      });

      return moves;
    }

    handleNodeClick(nodeIdx) {
      if (this.selectedIdx === null) {
        if (this.board[nodeIdx] === this.turn) {
          this.selectedIdx = nodeIdx;
          this.legalMoves = this.getLegalMovesForNode(nodeIdx, this.board, this.turn);
          const jumps = this.legalMoves.filter(m => m.isJump).length;
          if (jumps > 0) {
            this.setMessage(`Selected piece: ${jumps} leap capture(s) available!`);
          } else {
            this.setMessage(`Selected piece: Click adjacent highlighted node to slide.`);
          }
          this.updateHighlightMarkers();
        }
      } else {
        if (this.selectedIdx === nodeIdx) {
          this.selectedIdx = null;
          this.legalMoves = [];
          this.updateHighlightMarkers();
          return;
        }

        const chosenMove = this.legalMoves.find(m => m.to === nodeIdx);
        if (chosenMove) {
          this.executeMove(chosenMove);
          this.selectedIdx = null;
          this.legalMoves = [];
          return;
        }

        // Reselect another friendly piece
        if (this.board[nodeIdx] === this.turn) {
          this.selectedIdx = nodeIdx;
          this.legalMoves = this.getLegalMovesForNode(nodeIdx, this.board, this.turn);
          this.updateHighlightMarkers();
        } else {
          this.selectedIdx = null;
          this.legalMoves = [];
          this.updateHighlightMarkers();
        }
      }
    }

    executeMove(move) {
      this.board[move.from] = -1;
      if (move.isJump) {
        this.board[move.over] = -1; // Captured!
      }
      this.board[move.to] = this.turn;

      this.updatePieces3D();
      if (move.isJump) {
        this.setMessage('Leap capture executed!');
      }

      this.passTurn();
    }

    passTurn() {
      const p0Count = this.board.filter(v => v === 0).length;
      const p1Count = this.board.filter(v => v === 1).length;

      if (p1Count === 0) {
        this.winner = 0;
        this.setMessage('🎉 LAPIS ARMY WINS PRETWA!');
        this.updateHUD();
        return;
      }
      if (p0Count === 0) {
        this.winner = 1;
        this.setMessage('🎉 CARNELIAN ARMY WINS PRETWA!');
        this.updateHUD();
        return;
      }

      this.turn = this.turn === 0 ? 1 : 0;
      this.updateHUD();

      if (this.turn === 1 && this.gameMode === 'ai' && this.winner === -1) {
        this.setMessage('Carnelian AI calculating geometric leaps...');
        setTimeout(() => this.executeAI(), 600);
      } else {
        this.setMessage(`Lapis turn: Select a piece to slide or leap.`);
      }
    }

    executeAI() {
      if (this.winner !== -1) return;

      const aiMoves = [];
      this.board.forEach((v, idx) => {
        if (v === 1) {
          const moves = this.getLegalMovesForNode(idx, this.board, 1);
          moves.forEach(m => aiMoves.push(m));
        }
      });

      if (aiMoves.length === 0) {
        this.winner = 0;
        this.setMessage('Carnelian AI has no legal moves! Lapis Wins!');
        return;
      }

      // 1. Prioritize Jump Captures
      const jumps = aiMoves.filter(m => m.isJump);
      if (jumps.length > 0) {
        this.executeMove(jumps[Math.floor(Math.random() * jumps.length)]);
        return;
      }

      // 2. Otherwise advance towards center / human pieces
      aiMoves.sort((a, b) => a.to - b.to);
      this.executeMove(aiMoves[0]);
    }

    initDOMControls() {
      const startBtn = document.getElementById('start-game-btn');
      const setupModal = document.getElementById('game-setup-modal');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (setupModal) setupModal.style.display = 'none';
          this.startNewGame();
        });
      }

      const modeBtns = document.querySelectorAll('.mode-btn');
      modeBtns.forEach(b => b.addEventListener('click', () => {
        modeBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        this.gameMode = b.getAttribute('data-mode');
      }));

      const diffBtns = document.querySelectorAll('.diff-btn');
      diffBtns.forEach(b => b.addEventListener('click', () => {
        diffBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        this.aiDifficulty = b.getAttribute('data-diff') || 'medium';
      }));
    }

    startNewGame() {
      this.board = Array(19).fill(-1);
      this.board[0] = -1; // Center empty
      for (let i = 1; i <= 9; i++) this.board[i] = 0;  // South Player (Lapis)
      for (let i = 10; i <= 18; i++) this.board[i] = 1; // North Player (Carnelian)
      this.turn = 0;
      this.winner = -1;
      this.selectedIdx = null;
      this.legalMoves = [];
      this.updatePieces3D();
      this.updateHUD();
      this.setMessage('Pretwa started! Select a Lapis piece to move or leap.');
    }

    updateHUD() {
      const p0 = this.board.filter(v => v === 0).length;
      const p1 = this.board.filter(v => v === 1).length;
      const name = document.getElementById('current-player-name');
      const dot = document.getElementById('current-player-color-dot');
      if (dot) dot.style.background = this.turn === 0 ? '#1D4ED8' : '#DC2626';
      if (name) name.textContent = `Lapis: ${p0} pieces • Carnelian: ${p1} pieces`;
    }

    setMessage(msg) {
      const banner = document.getElementById('hud-message-banner');
      if (banner) banner.textContent = msg;
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      if (this.dustParticles) {
        this.dustParticles.rotation.y += 0.0005;
      }
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Export for test suite
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      buildAdjacency,
      buildJumpLines,
      NODE_COORDS,
      ADJACENCY,
      JUMP_LINES
    };
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new PretwaApp());
    else new PretwaApp();
  }
})();
