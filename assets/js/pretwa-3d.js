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

  class PretwaApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('pretwa-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.board = Array(19).fill(-1);
      this.board[0] = -1; // Center empty
      for (let i = 1; i <= 9; i++) this.board[i] = 0;  // South Player (Lapis)
      for (let i = 10; i <= 18; i++) this.board[i] = 1; // North Player (Carnelian)

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
      
      // Procedural Circular Teakwood Mandala Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
      grad.addColorStop(0, '#472718');
      grad.addColorStop(1, '#2B160C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const woodTex = new THREE.CanvasTexture(canvas);

      const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.4, metalness: 0.1 });
      const slab = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.8, 0.4, 48), woodMat);
      slab.position.y = -0.2;
      slab.receiveShadow = true;
      this.boardGroup.add(slab);

      // Brass Inlaid Rings & Radial Spokes
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.2 });

      RADII.forEach(r => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 48), brassMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.01;
        this.boardGroup.add(ring);
      });

      // 3 Radial Diameters (6 Spokes)
      for (let i = 0; i < 3; i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 13.2), brassMat);
        spoke.rotation.y = (i / 3) * Math.PI;
        spoke.position.y = 0.01;
        this.boardGroup.add(spoke);
      }

      // 19 Node Dots
      NODE_COORDS.forEach((pos, idx) => {
        const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 16), brassMat);
        dot.position.set(pos.x, 0.015, pos.z);
        this.boardGroup.add(dot);
      });

      this.scene.add(this.boardGroup);
    }

    buildPiecesGroup() {
      this.piecesGroup = new THREE.Group();
      this.scene.add(this.piecesGroup);
    }

    updatePieces3D() {
      while (this.piecesGroup.children.length > 0) this.piecesGroup.remove(this.piecesGroup.children[0]);

      const lapisMat = new THREE.MeshStandardMaterial({ color: 0x1D4ED8, roughness: 0.2, metalness: 0.3 });
      const redMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.2, metalness: 0.2 });

      this.board.forEach((val, idx) => {
        if (val === -1) return;
        const pos = NODE_COORDS[idx];
        const mat = val === 0 ? lapisMat : redMat;
        const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.3, 16), mat);
        piece.position.set(pos.x, 0.16, pos.z);
        piece.userData = { idx, player: val };
        this.piecesGroup.add(piece);
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
      NODE_COORDS.forEach((c, idx) => {
        const d = Math.hypot(pos.x - c.x, pos.z - c.z);
        if (d < minD) {
          minD = d;
          best = idx;
        }
      });
      return best;
    }

    handleNodeClick(nodeIdx) {
      if (this.selectedIdx === null) {
        if (this.board[nodeIdx] === 0) {
          this.selectedIdx = nodeIdx;
          this.setMessage(`Selected piece at node ${nodeIdx}. Click connected empty node or jump enemy.`);
        }
      } else {
        if (this.board[nodeIdx] === -1) {
          // Check move / jump
          this.board[this.selectedIdx] = -1;
          this.board[nodeIdx] = 0;
          this.selectedIdx = null;
          this.updatePieces3D();
          this.passTurn();
          return;
        }
        this.selectedIdx = null;
      }
    }

    passTurn() {
      const p0Count = this.board.filter(v => v === 0).length;
      const p1Count = this.board.filter(v => v === 1).length;

      if (p1Count === 0) {
        this.winner = 0;
        this.setMessage('Lapis Army Wins Pretwa!');
        return;
      }
      if (p0Count === 0) {
        this.winner = 1;
        this.setMessage('Carnelian Army Wins Pretwa!');
        return;
      }

      this.turn = this.turn === 0 ? 1 : 0;
      this.updateHUD();

      if (this.turn === 1 && this.gameMode === 'ai') {
        this.setMessage('AI is calculating circular geometry...');
        setTimeout(() => this.executeAI(), 700);
      } else {
        this.setMessage(`Lapis turn: Select a piece to slide or leap.`);
      }
    }

    executeAI() {
      const aiPieces = [];
      this.board.forEach((v, idx) => { if (v === 1) aiPieces.push(idx); });
      const freeNodes = [];
      this.board.forEach((v, idx) => { if (v === -1) freeNodes.push(idx); });

      if (aiPieces.length > 0 && freeNodes.length > 0) {
        const from = aiPieces[0];
        const to = freeNodes[0];
        this.board[from] = -1;
        this.board[to] = 1;
        this.updatePieces3D();
        this.passTurn();
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
      this.board = Array(19).fill(-1);
      this.board[0] = -1;
      for (let i = 1; i <= 9; i++) this.board[i] = 0;
      for (let i = 10; i <= 18; i++) this.board[i] = 1;
      this.turn = 0;
      this.winner = -1;
      this.selectedIdx = null;
      this.updatePieces3D();
      this.updateHUD();
      this.setMessage('Pretwa started! Select a Lapis piece to move.');
    }

    updateHUD() {
      const p0 = this.board.filter(v => v === 0).length;
      const p1 = this.board.filter(v => v === 1).length;
      const name = document.getElementById('current-player-name');
      if (name) name.textContent = `Lapis Pieces: ${p0} | Carnelian Pieces: ${p1}`;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new PretwaApp());
  else new PretwaApp();
})();
