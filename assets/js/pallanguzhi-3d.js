/**
 * ==============================================================================
 * Mantrika Games — Pallanguzhi 3D (Traditional Indian Mancala) Engine
 * ==============================================================================
 */
(function() {
  'use strict';

  class PallanguzhiApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('pallanguzhi-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.pits = Array(14).fill(5); // 0-6 South, 7-13 North
      this.stores = { 0: 0, 1: 0 };
      this.turn = 0; // 0 = Player 1 (South), 1 = Player 2 (North/AI)
      this.isSowing = false;
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

      this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      this.camera.position.set(0, 14, 11);
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
      this.buildSeedsGroup();
      this.setupInteraction();
      this.animate();
    }

    buildBoard() {
      this.boardGroup = new THREE.Group();
      
      // Procedural Mahogany Wood Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
      grad.addColorStop(0, '#5C3520');
      grad.addColorStop(1, '#331B0E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const woodTex = new THREE.CanvasTexture(canvas);

      const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.35, metalness: 0.1 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 5.5), woodMat);
      slab.position.y = -0.25;
      slab.receiveShadow = true;
      this.boardGroup.add(slab);

      // 14 Cups / Pits (2 rows of 7)
      const cupMat = new THREE.MeshStandardMaterial({ color: 0x361E11, roughness: 0.5 });
      this.cupMeshes = [];

      for (let i = 0; i < 14; i++) {
        const pos = this.pitToWorld(i);
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.7, 0.35, 24), cupMat);
        cup.position.set(pos.x, 0.02, pos.z);
        cup.userData = { pitIdx: i };
        this.boardGroup.add(cup);
        this.cupMeshes.push(cup);
      }

      this.scene.add(this.boardGroup);
    }

    buildSeedsGroup() {
      this.seedsGroup = new THREE.Group();
      this.scene.add(this.seedsGroup);
    }

    pitToWorld(pitIdx) {
      if (pitIdx < 7) {
        // South row (0 to 6 from left to right)
        return { x: -6 + pitIdx * 2.0, z: 1.3 };
      } else {
        // North row (7 to 13 from right to left)
        return { x: 6 - (pitIdx - 7) * 2.0, z: -1.3 };
      }
    }

    updateSeeds3D() {
      while (this.seedsGroup.children.length > 0) this.seedsGroup.remove(this.seedsGroup.children[0]);

      const seedMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.3, metalness: 0.2 });

      this.pits.forEach((count, pitIdx) => {
        if (count === 0) return;
        const pos = this.pitToWorld(pitIdx);

        for (let s = 0; s < Math.min(count, 12); s++) {
          const seed = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), seedMat);
          seed.scale.set(1.2, 0.7, 0.9);
          const angle = (s / Math.min(count, 12)) * Math.PI * 2;
          const r = 0.35;
          seed.position.set(pos.x + Math.cos(angle) * r, 0.12 + Math.floor(s / 6) * 0.15, pos.z + Math.sin(angle) * r);
          this.seedsGroup.add(seed);
        }
      });
    }

    setupInteraction() {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      this.canvas.addEventListener('click', (e) => {
        if (this.isSowing || this.winner !== -1 || (this.gameMode === 'ai' && this.turn === 1)) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const hits = this.raycaster.intersectObjects(this.cupMeshes);
        if (hits.length > 0) {
          const pitIdx = hits[0].object.userData.pitIdx;
          if (pitIdx >= 0 && pitIdx <= 6 && this.pits[pitIdx] > 0) {
            this.executeSow(pitIdx);
          }
        }
      });
    }

    executeSow(startPit) {
      this.isSowing = true;
      let hand = this.pits[startPit];
      this.pits[startPit] = 0;
      this.updateSeeds3D();

      let cur = startPit;
      const stepInterval = setInterval(() => {
        if (hand > 0) {
          cur = (cur + 1) % 14;
          this.pits[cur]++;
          hand--;
          this.updateSeeds3D();
        } else {
          // Hand empty: Check next pit
          const nextPit = (cur + 1) % 14;
          if (this.pits[nextPit] > 0) {
            // Scoop next pit seeds and continue
            hand = this.pits[nextPit];
            this.pits[nextPit] = 0;
            cur = nextPit;
            this.updateSeeds3D();
          } else {
            // Empty next pit: Check opposite/following pit for capture!
            clearInterval(stepInterval);
            const capturePit = (nextPit + 1) % 14;
            if (this.pits[capturePit] > 0) {
              const captured = this.pits[capturePit];
              this.pits[capturePit] = 0;
              this.stores[this.turn] += captured;
              this.setMessage(`Captured ${captured} seeds!`);
            }
            this.isSowing = false;
            this.updateSeeds3D();
            this.passTurn();
          }
        }
      }, 140);
    }

    passTurn() {
      this.turn = this.turn === 0 ? 1 : 0;
      this.updateHUD();

      // Check game end
      const southSeeds = this.pits.slice(0, 7).reduce((a,b)=>a+b, 0);
      const northSeeds = this.pits.slice(7, 14).reduce((a,b)=>a+b, 0);

      if (southSeeds === 0 || northSeeds === 0) {
        this.winner = this.stores[0] >= this.stores[1] ? 0 : 1;
        this.setMessage(`Game Over! ${this.winner === 0 ? 'Player 1' : 'Player 2'} Wins with ${this.stores[this.winner]} seeds!`);
        return;
      }

      if (this.turn === 1 && this.gameMode === 'ai') {
        this.setMessage('AI is calculating best pit to sow...');
        setTimeout(() => {
          // Pick non-empty North pit with most seeds
          let bestPit = 7;
          let maxS = -1;
          for (let p = 7; p <= 13; p++) {
            if (this.pits[p] > maxS) {
              maxS = this.pits[p];
              bestPit = p;
            }
          }
          if (maxS > 0) this.executeSow(bestPit);
        }, 800);
      } else {
        this.setMessage(`Player 1's turn: Click one of your 7 bottom pits to sow seeds.`);
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
      this.pits = Array(14).fill(5);
      this.stores = { 0: 0, 1: 0 };
      this.turn = 0;
      this.winner = -1;
      this.isSowing = false;
      this.updateSeeds3D();
      this.updateHUD();
      this.setMessage('Pallanguzhi started! Click one of your 7 bottom pits to sow.');
    }

    updateHUD() {
      const name = document.getElementById('current-player-name');
      if (name) name.textContent = `P1 Store: ${this.stores[0]} seeds | P2 Store: ${this.stores[1]} seeds`;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new PallanguzhiApp());
  else new PallanguzhiApp();
})();
