/**
 * ==============================================================================
 * Mantrika Games — Twelve Beads 3D (Baro Guti) Engine
 * ==============================================================================
 */
(function() {
  'use strict';

  const GRID_SIZE = 5;
  const CELL_W = 2.2;
  const SPAN = (GRID_SIZE - 1) * CELL_W;
  const HALF_SPAN = SPAN / 2;

  class TwelveBeadsApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('twelve-beads-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.board = Array(25).fill(-1); // 0-11 Red (P0), 12 Empty, 13-24 Gold (P1)
      for (let i = 0; i < 12; i++) this.board[i] = 0;
      this.board[12] = -1;
      for (let i = 13; i < 25; i++) this.board[i] = 1;

      this.turn = 0;
      this.selectedIdx = null;
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
      this.camera.position.set(0, 16, 12);
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

      // Floating Ambient Gold Dust Motes Particle System
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
      this.setupInteraction();
      this.animate();
    }

    buildBoard() {
      this.boardGroup = new THREE.Group();
      
      // Procedural Walnut Wood Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
      grad.addColorStop(0, '#422213');
      grad.addColorStop(1, '#27130A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const woodTex = new THREE.CanvasTexture(canvas);

      const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.4, metalness: 0.1 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(SPAN + 2.5, 0.4, SPAN + 2.5), woodMat);
      slab.position.y = -0.2;
      slab.receiveShadow = true;
      this.boardGroup.add(slab);

      // Brass Inlaid Lines (5x5 grid + diagonals)
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });

      for (let i = 0; i < GRID_SIZE; i++) {
        const offset = -HALF_SPAN + i * CELL_W;
        const hLine = new THREE.Mesh(new THREE.BoxGeometry(SPAN, 0.02, 0.04), lineMat);
        hLine.position.set(0, 0.01, offset);
        const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, SPAN), lineMat);
        vLine.position.set(offset, 0.01, 0);
        this.boardGroup.add(hLine, vLine);
      }

      // Diagonals
      const diagLen = SPAN * Math.SQRT2;
      const d1 = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.02, 0.04), lineMat); d1.rotation.y = Math.PI / 4; d1.position.y = 0.01;
      const d2 = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.02, 0.04), lineMat); d2.rotation.y = -Math.PI / 4; d2.position.y = 0.01;
      this.boardGroup.add(d1, d2);

      this.scene.add(this.boardGroup);
    }

    buildPiecesGroup() {
      this.piecesGroup = new THREE.Group();
      this.scene.add(this.piecesGroup);
    }

    nodeToWorld(idx) {
      const r = Math.floor(idx / 5);
      const c = idx % 5;
      return {
        x: -HALF_SPAN + c * CELL_W,
        y: 0.05,
        z: -HALF_SPAN + r * CELL_W
      };
    }

    updatePieces3D() {
      while (this.piecesGroup.children.length > 0) this.piecesGroup.remove(this.piecesGroup.children[0]);

      const redMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.25, metalness: 0.2 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.25, metalness: 0.4 });

      this.board.forEach((val, idx) => {
        if (val === -1) return;
        const pos = this.nodeToWorld(idx);
        const mat = val === 0 ? redMat : goldMat;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), mat);
        bead.position.set(pos.x, 0.35, pos.z);
        bead.userData = { idx, player: val };
        this.piecesGroup.add(bead);
      });
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
      for (let i = 0; i < 25; i++) {
        const w = this.nodeToWorld(i);
        const d = Math.hypot(pos.x - w.x, pos.z - w.z);
        if (d < minD) {
          minD = d;
          best = i;
        }
      }
      return best;
    }

    handleNodeClick(nodeIdx) {
      if (this.selectedIdx === null) {
        if (this.board[nodeIdx] === 0) {
          this.selectedIdx = nodeIdx;
          this.setMessage(`Selected bead at node ${nodeIdx}. Click adjacent empty node or leap over enemy.`);
        }
      } else {
        if (this.board[nodeIdx] === -1) {
          // Check normal move
          if (this.isAdjacent(this.selectedIdx, nodeIdx)) {
            this.board[this.selectedIdx] = -1;
            this.board[nodeIdx] = 0;
            this.selectedIdx = null;
            this.updatePieces3D();
            this.passTurn();
            return;
          }
          // Check jump capture
          const mid = this.getMiddleNode(this.selectedIdx, nodeIdx);
          if (mid !== -1 && this.board[mid] === 1) {
            this.board[this.selectedIdx] = -1;
            this.board[mid] = -1; // Captured!
            this.board[nodeIdx] = 0;
            this.selectedIdx = null;
            this.updatePieces3D();
            this.setMessage('Leap capture executed!');
            this.passTurn();
            return;
          }
        }
        this.selectedIdx = null;
      }
    }

    isAdjacent(a, b) {
      const r1 = Math.floor(a / 5), c1 = a % 5;
      const r2 = Math.floor(b / 5), c2 = b % 5;
      const dr = Math.abs(r1 - r2);
      const dc = Math.abs(c1 - c2);
      if (dr + dc === 1) return true;
      if (dr === 1 && dc === 1 && (r1 + c1) % 2 === 0) return true;
      return false;
    }

    getMiddleNode(a, b) {
      const r1 = Math.floor(a / 5), c1 = a % 5;
      const r2 = Math.floor(b / 5), c2 = b % 5;
      if ((r1 + r2) % 2 === 0 && (c1 + c2) % 2 === 0) {
        const midR = (r1 + r2) / 2;
        const midC = (c1 + c2) / 2;
        const midIdx = midR * 5 + midC;
        if (this.isAdjacent(a, midIdx) && this.isAdjacent(midIdx, b)) {
          return midIdx;
        }
      }
      return -1;
    }

    passTurn() {
      const redCount = this.board.filter(v => v === 0).length;
      const goldCount = this.board.filter(v => v === 1).length;

      if (goldCount === 0) {
        this.winner = 0;
        this.setMessage('Red Army Wins Twelve Beads!');
        return;
      }
      if (redCount === 0) {
        this.winner = 1;
        this.setMessage('Gold Army Wins Twelve Beads!');
        return;
      }

      this.turn = this.turn === 0 ? 1 : 0;
      this.updateHUD();

      if (this.turn === 1 && this.gameMode === 'ai') {
        this.setMessage('AI is evaluating tactics...');
        setTimeout(() => this.executeAI(), 700);
      } else {
        this.setMessage(`Red Army turn: Select a bead to move or leap.`);
      }
    }

    executeAI() {
      const goldBeads = [];
      this.board.forEach((v, idx) => { if (v === 1) goldBeads.push(idx); });

      // Look for jump captures first
      for (let from of goldBeads) {
        for (let to = 0; to < 25; to++) {
          if (this.board[to] === -1) {
            const mid = this.getMiddleNode(from, to);
            if (mid !== -1 && this.board[mid] === 0) {
              this.board[from] = -1;
              this.board[mid] = -1;
              this.board[to] = 1;
              this.updatePieces3D();
              this.setMessage('AI captured a Red bead!');
              this.passTurn();
              return;
            }
          }
        }
      }

      // Normal move
      for (let from of goldBeads) {
        for (let to = 0; to < 25; to++) {
          if (this.board[to] === -1 && this.isAdjacent(from, to)) {
            this.board[from] = -1;
            this.board[to] = 1;
            this.updatePieces3D();
            this.passTurn();
            return;
          }
        }
      }
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
      this.board = Array(25).fill(-1);
      for (let i = 0; i < 12; i++) this.board[i] = 0;
      this.board[12] = -1;
      for (let i = 13; i < 25; i++) this.board[i] = 1;
      this.turn = 0;
      this.winner = -1;
      this.selectedIdx = null;
      this.updatePieces3D();
      this.updateHUD();
      this.setMessage('Twelve Beads started! Select a Red bead to move.');
    }

    updateHUD() {
      const redCount = this.board.filter(v => v === 0).length;
      const goldCount = this.board.filter(v => v === 1).length;
      const name = document.getElementById('current-player-name');
      if (name) name.textContent = `Red Army: ${redCount} | Gold Army: ${goldCount}`;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new TwelveBeadsApp());
  else new TwelveBeadsApp();
})();
