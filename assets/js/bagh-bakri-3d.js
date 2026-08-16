/**
 * ==============================================================================
 * Mantrika Games — Bagh Bakri 3D (Tigers & Goats / Bagh Chal) Engine
 * ==============================================================================
 */
(function() {
  'use strict';

  const GRID_SIZE = 5;
  const CELL_W = 2.2;
  const SPAN = (GRID_SIZE - 1) * CELL_W;
  const HALF_SPAN = SPAN / 2;

  class BaghBakriApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('bagh-bakri-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.playerRole = 'goat'; // Human plays Goats, AI plays Tigers
      this.tigers = [{r:0,c:0}, {r:0,c:4}, {r:4,c:0}, {r:4,c:4}];
      this.goats = [];
      this.goatsPlaced = 0;
      this.goatsCaptured = 0;
      this.turn = 'goat';
      this.winner = null;
      this.selectedPiece = null;
      this.legalMoves = [];
      this.highlightMeshes = [];

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
      
      // Procedural Rosewood Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
      grad.addColorStop(0, '#4D2A18');
      grad.addColorStop(1, '#2E170C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const woodTex = new THREE.CanvasTexture(canvas);

      const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.4, metalness: 0.1 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(SPAN + 2.5, 0.4, SPAN + 2.5), woodMat);
      slab.position.y = -0.2;
      slab.receiveShadow = true;
      this.boardGroup.add(slab);

      // Brass Inlay Lines
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });

      // Orthogonal grid lines
      for (let i = 0; i < GRID_SIZE; i++) {
        const offset = -HALF_SPAN + i * CELL_W;
        const hLine = new THREE.Mesh(new THREE.BoxGeometry(SPAN, 0.02, 0.04), lineMat);
        hLine.position.set(0, 0.01, offset);
        const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, SPAN), lineMat);
        vLine.position.set(offset, 0.01, 0);
        this.boardGroup.add(hLine, vLine);
      }

      // Diagonals (Corner-to-corner & mid-to-mid diamonds)
      const diagMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });
      const diagLen = SPAN * Math.SQRT2;
      const d1 = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.02, 0.04), diagMat);
      d1.rotation.y = Math.PI / 4;
      d1.position.y = 0.01;
      const d2 = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.02, 0.04), diagMat);
      d2.rotation.y = -Math.PI / 4;
      d2.position.y = 0.01;

      const diamondLen = (SPAN / 2) * Math.SQRT2;
      const dm1 = new THREE.Mesh(new THREE.BoxGeometry(diamondLen, 0.02, 0.04), diagMat);
      dm1.position.set(-HALF_SPAN/2, 0.01, -HALF_SPAN/2); dm1.rotation.y = Math.PI/4;
      const dm2 = new THREE.Mesh(new THREE.BoxGeometry(diamondLen, 0.02, 0.04), diagMat);
      dm2.position.set(HALF_SPAN/2, 0.01, -HALF_SPAN/2); dm2.rotation.y = -Math.PI/4;
      const dm3 = new THREE.Mesh(new THREE.BoxGeometry(diamondLen, 0.02, 0.04), diagMat);
      dm3.position.set(-HALF_SPAN/2, 0.01, HALF_SPAN/2); dm3.rotation.y = -Math.PI/4;
      const dm4 = new THREE.Mesh(new THREE.BoxGeometry(diamondLen, 0.02, 0.04), diagMat);
      dm4.position.set(HALF_SPAN/2, 0.01, HALF_SPAN/2); dm4.rotation.y = Math.PI/4;

      this.boardGroup.add(d1, d2, dm1, dm2, dm3, dm4);
      this.scene.add(this.boardGroup);
    }

    buildPiecesGroup() {
      this.piecesGroup = new THREE.Group();
      this.scene.add(this.piecesGroup);
    }

    gridToWorld(r, c) {
      return {
        x: -HALF_SPAN + c * CELL_W,
        y: 0.05,
        z: -HALF_SPAN + r * CELL_W
      };
    }

    updatePieces3D() {
      while (this.piecesGroup.children.length > 0) this.piecesGroup.remove(this.piecesGroup.children[0]);

      // Render Tigers (Sculpted Brass)
      const tigerMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.25 });
      this.tigers.forEach((t, idx) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.9, 16), tigerMat);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), tigerMat);
        head.position.y = 0.65;
        mesh.add(head);

        const pos = this.gridToWorld(t.r, t.c);
        mesh.position.set(pos.x, 0.45, pos.z);
        mesh.userData = { type: 'tiger', idx };
        this.piecesGroup.add(mesh);
      });

      // Render Goats (Terracotta / Emerald)
      const goatMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4, metalness: 0.1 });
      this.goats.forEach((g, idx) => {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 16), goatMat);
        const pos = this.gridToWorld(g.r, g.c);
        mesh.position.set(pos.x, 0.3, pos.z);
        mesh.userData = { type: 'goat', idx };
        this.piecesGroup.add(mesh);
      });
    }

    setupInteraction() {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.winner || (this.gameMode === 'ai' && this.turn === 'tiger')) return;

        // In Placement Phase (Goats placed on empty nodes)
        if (this.turn === 'goat' && this.goatsPlaced < 20) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hitPos = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(plane, hitPos)) {
            const nearest = this.getNearestGridNode(hitPos);
            if (nearest && !this.isOccupied(nearest.r, nearest.c)) {
              this.placeGoat(nearest.r, nearest.c);
            }
          }
          return;
        }

        // Movement Phase
        const hits = this.raycaster.intersectObjects(this.piecesGroup.children, true);
        if (hits.length > 0) {
          let root = hits[0].object;
          while (root.parent && root.parent !== this.piecesGroup) root = root.parent;
          if (root.userData && root.userData.type === 'goat') {
            this.selectedPiece = root.userData;
            this.setMessage(`Goat selected. Click an adjacent empty node to move.`);
          }
        } else if (this.selectedPiece) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hitPos = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(plane, hitPos)) {
            const nearest = this.getNearestGridNode(hitPos);
            if (nearest && this.isAdjacent(this.goats[this.selectedPiece.idx], nearest) && !this.isOccupied(nearest.r, nearest.c)) {
              this.goats[this.selectedPiece.idx] = nearest;
              this.selectedPiece = null;
              this.updatePieces3D();
              this.passTurn();
            }
          }
        }
      });
    }

    getNearestGridNode(pos) {
      let best = null;
      let minD = 0.8;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const w = this.gridToWorld(r, c);
          const d = Math.hypot(pos.x - w.x, pos.z - w.z);
          if (d < minD) {
            minD = d;
            best = { r, c };
          }
        }
      }
      return best;
    }

    isOccupied(r, c) {
      return this.tigers.some(t => t.r === r && t.c === c) || this.goats.some(g => g.r === r && g.c === c);
    }

    isAdjacent(a, b) {
      const dr = Math.abs(a.r - b.r);
      const dc = Math.abs(a.c - b.c);
      if (dr + dc === 1) return true; // Orthogonal
      if (dr === 1 && dc === 1 && (a.r + a.c) % 2 === 0) return true; // Diagonal
      return false;
    }

    placeGoat(r, c) {
      this.goats.push({ r, c });
      this.goatsPlaced++;
      this.updatePieces3D();
      this.updateHUD();
      this.passTurn();
    }

    passTurn() {
      this.checkWinConditions();
      if (this.winner) return;

      this.turn = this.turn === 'goat' ? 'tiger' : 'goat';
      this.updateHUD();

      if (this.turn === 'tiger' && this.gameMode === 'ai') {
        this.setMessage('Tiger AI is stalking prey...');
        setTimeout(() => this.executeTigerAI(), 700);
      } else {
        if (this.goatsPlaced < 20) {
          this.setMessage(`Goat's turn: Place goat #${this.goatsPlaced + 1} of 20 on an empty node.`);
        } else {
          this.setMessage(`Goat's turn: Select and slide a goat along grid lines.`);
        }
      }
    }

    executeTigerAI() {
      // Find captures first (jumps)
      for (let i = 0; i < this.tigers.length; i++) {
        const t = this.tigers[i];
        for (let gIdx = 0; gIdx < this.goats.length; gIdx++) {
          const g = this.goats[gIdx];
          if (this.isAdjacent(t, g)) {
            const landingR = g.r + (g.r - t.r);
            const landingC = g.c + (g.c - t.c);
            if (landingR >= 0 && landingR < 5 && landingC >= 0 && landingC < 5 && !this.isOccupied(landingR, landingC)) {
              // Tiger Jump Capture!
              this.tigers[i] = { r: landingR, c: landingC };
              this.goats.splice(gIdx, 1);
              this.goatsCaptured++;
              this.updatePieces3D();
              this.setMessage(`Tiger jumped and captured a goat! (${this.goatsCaptured} captured)`);
              this.passTurn();
              return;
            }
          }
        }
      }

      // Normal adjacent move
      for (let i = 0; i < this.tigers.length; i++) {
        const t = this.tigers[i];
        const nbrs = this.getNeighbors(t);
        const freeNbrs = nbrs.filter(n => !this.isOccupied(n.r, n.c));
        if (freeNbrs.length > 0) {
          this.tigers[i] = freeNbrs[Math.floor(Math.random() * freeNbrs.length)];
          this.updatePieces3D();
          this.passTurn();
          return;
        }
      }

      // No moves available for any tiger! Goats win!
      this.winner = 'goat';
      this.setMessage('All 4 Tigers are trapped! Goats Win!');
    }

    getNeighbors(node) {
      const res = [];
      const { r, c } = node;
      if (r > 0) res.push({ r: r - 1, c });
      if (r < 4) res.push({ r: r + 1, c });
      if (c > 0) res.push({ r, c: c - 1 });
      if (c < 4) res.push({ r, c: c + 1 });
      if ((r + c) % 2 === 0) {
        if (r > 0 && c > 0) res.push({ r: r - 1, c: c - 1 });
        if (r > 0 && c < 4) res.push({ r: r - 1, c: c + 1 });
        if (r < 4 && c > 0) res.push({ r: r + 1, c: c - 1 });
        if (r < 4 && c < 4) res.push({ r: r + 1, c: c + 1 });
      }
      return res;
    }

    checkWinConditions() {
      if (this.goatsCaptured >= 5) {
        this.winner = 'tiger';
        this.setMessage('Tigers captured 5 Goats and Win!');
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
      this.tigers = [{r:0,c:0}, {r:0,c:4}, {r:4,c:0}, {r:4,c:4}];
      this.goats = [];
      this.goatsPlaced = 0;
      this.goatsCaptured = 0;
      this.turn = 'goat';
      this.winner = null;
      this.updatePieces3D();
      this.updateHUD();
      this.setMessage('Bagh Bakri started! Place goat #1 of 20 on an empty node.');
    }

    updateHUD() {
      const dot = document.getElementById('current-player-color-dot');
      const name = document.getElementById('current-player-name');
      if (dot) dot.style.background = this.turn === 'goat' ? '#059669' : '#D97706';
      if (name) name.textContent = this.turn === 'goat' ? `Goats (Placed: ${this.goatsPlaced}/20)` : `Tigers (Captured: ${this.goatsCaptured}/5)`;
    }

    setMessage(msg) {
      const banner = document.getElementById('hud-message-banner');
      if (banner) banner.textContent = msg;
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      this.renderer.render(this.scene, this.camera);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new BaghBakriApp());
  else new BaghBakriApp();
})();
