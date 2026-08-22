/**
 * ==============================================================================
 * Mantrika Games — Chaupar 3D Handcrafted WebGL Engine
 * ==============================================================================
 */
(function() {
  'use strict';

  const PLAYER_CONFIG = [
    { id: 0, name: 'Player 1 (South)', color: 0xB91C1C, hex: '#B91C1C', nameShort: 'Crimson' },
    { id: 1, name: 'Player 2 (East)',  color: 0xD97706, hex: '#D97706', nameShort: 'Saffron' },
    { id: 2, name: 'Player 3 (North)', color: 0x047857, hex: '#047857', nameShort: 'Emerald' },
    { id: 3, name: 'Player 4 (West)',  color: 0x1D4ED8, hex: '#1D4ED8', nameShort: 'Lapis' }
  ];

  class ChauparApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('chaupar-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.activePlayerIndices = [0, 2];
      this.currentTurnIndex = 0;
      this.pawnsState = { 0: [0,0,0,0], 2: [0,0,0,0] };
      this.pasaValues = [1, 2, 5];
      this.isRolling = false;
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
      this.buildPasaDice();
      this.buildPawns();
      this.setupInteraction();
      this.animate();
    }

    buildBoard() {
      this.boardGroup = new THREE.Group();
      
      // Procedural Woven Royal Cloth Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#3D1711';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 3;
      for (let i = 64; i < 512; i += 64) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
      const clothTex = new THREE.CanvasTexture(canvas);

      const velvetMat = new THREE.MeshStandardMaterial({ map: clothTex, roughness: 0.55, metalness: 0.1 });
      const center = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 4), velvetMat);
      center.position.y = -0.2;
      center.receiveShadow = true;

      const armGeo = new THREE.BoxGeometry(3.6, 0.35, 7.2);
      const armS = new THREE.Mesh(armGeo, velvetMat); armS.position.set(0, -0.18, 5.6); armS.receiveShadow = true;
      const armN = new THREE.Mesh(armGeo, velvetMat); armN.position.set(0, -0.18, -5.6); armN.receiveShadow = true;
      const armE = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 3.6), velvetMat); armE.position.set(5.6, -0.18, 0); armE.receiveShadow = true;
      const armW = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 3.6), velvetMat); armW.position.set(-5.6, -0.18, 0); armW.receiveShadow = true;

      this.boardGroup.add(center, armS, armN, armE, armW);
      this.scene.add(this.boardGroup);
    }

    buildPasaDice() {
      this.pasaGroup = new THREE.Group();
      this.pasaGroup.position.set(7.5, 0.2, 7.5);
      this.pasaMeshes = [];

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x8C5638, roughness: 0.3 });
      for (let i = 0; i < 3; i++) {
        const diceGeo = new THREE.BoxGeometry(0.35, 0.35, 1.4);
        const die = new THREE.Mesh(diceGeo, woodMat);
        die.position.x = (i - 1) * 0.6;
        this.pasaGroup.add(die);
        this.pasaMeshes.push(die);
      }
      this.scene.add(this.pasaGroup);
    }

    buildPawns() {
      this.pawnsGroup = new THREE.Group();
      this.scene.add(this.pawnsGroup);
    }

    updatePawnPositions() {
      while (this.pawnsGroup.children.length > 0) this.pawnsGroup.remove(this.pawnsGroup.children[0]);
      this.activePlayerIndices.forEach(pId => {
        const mat = new THREE.MeshStandardMaterial({ color: PLAYER_CONFIG[pId].color, roughness: 0.3 });
        this.pawnsState[pId].forEach((step, pIdx) => {
          const pawn = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.9, 16), mat);
          pawn.position.y = 0.45;
          const pos = this.stepToWorld(pId, step, pIdx);
          pawn.position.set(pos.x, pos.y, pos.z);
          pawn.userData = { pId, pIdx };
          this.pawnsGroup.add(pawn);
        });
      });
    }

    stepToWorld(pId, step, pIdx) {
      if (step === 0) {
        const angle = (pId * Math.PI / 2) + (pIdx * 0.4) - 0.6;
        return { x: Math.cos(angle) * 6.5, y: 0.05, z: Math.sin(angle) * 6.5 };
      }
      if (step >= 40) return { x: (pIdx % 2 === 0 ? 0.3 : -0.3), y: 0.1, z: (pIdx >= 2 ? 0.3 : -0.3) };
      const progress = step / 40;
      const angle = (pId * Math.PI / 2);
      const rad = 6.5 * (1 - progress);
      return { x: Math.cos(angle) * rad + (pIdx * 0.15 - 0.2), y: 0.05, z: Math.sin(angle) * rad };
    }

    setupInteraction() {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.pawnsGroup.children);
        if (hits.length > 0) {
          const u = hits[0].object.userData;
          if (u && typeof u.pIdx !== 'undefined') this.handlePawnClick(u.pId, u.pIdx);
        }
      });
    }

    initDOMControls() {
      const rollBtn = document.getElementById('roll-dice-btn');
      if (rollBtn) rollBtn.addEventListener('click', () => this.triggerRoll());
      const startBtn = document.getElementById('start-game-btn');
      const setupModal = document.getElementById('game-setup-modal');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (setupModal) setupModal.style.display = 'none';
          this.startNewGame();
        });
      }
    }

    startNewGame() {
      this.activePlayerIndices = [0, 2];
      this.pawnsState = { 0: [0,0,0,0], 2: [0,0,0,0] };
      this.currentTurnIndex = 0;
      this.winner = -1;
      this.updatePawnPositions();
      this.updateHUD();
      this.setMessage('Chaupar started! Cast the 3 long Pasa dice.');
    }

    triggerRoll() {
      if (this.isRolling || this.winner !== -1) return;
      this.isRolling = true;
      const values = [1, 2, 5, 6];
      this.pasaValues = [values[Math.floor(Math.random()*4)], values[Math.floor(Math.random()*4)], values[Math.floor(Math.random()*4)]];
      const sum = this.pasaValues.reduce((a, b) => a + b, 0);

      setTimeout(() => {
        this.isRolling = false;
        const valEl = document.getElementById('roll-number-val');
        if (valEl) valEl.textContent = `${this.pasaValues.join('-')} (${sum})`;

        const curP = this.activePlayerIndices[this.currentTurnIndex];
        this.legalMoves = [];
        this.pawnsState[curP].forEach((s, idx) => {
          if (s + sum <= 40) {
            const targetStep = s + sum;
            let isBlockaded = false;
            let isCapture = false;

            if (targetStep > 0 && targetStep < 40) {
              this.activePlayerIndices.forEach(otherP => {
                if (otherP !== curP) {
                  const pawnsAtTarget = this.pawnsState[otherP].filter(step => step === targetStep).length;
                  if (pawnsAtTarget >= 2) {
                    isBlockaded = true; // Impenetrable Joori pair blockade!
                  } else if (pawnsAtTarget === 1) {
                    isCapture = true;
                  }
                }
              });
            }

            if (!isBlockaded) {
              this.legalMoves.push({ idx, from: s, to: targetStep, isCapture });
            }
          }
        });

        if (this.legalMoves.length === 0) {
          this.setMessage(`No legal moves for ${sum} (path blocked or reached limit). Passing turn...`);
          setTimeout(() => this.passTurn(), 1000);
        } else if (this.isAITurn()) {
          setTimeout(() => this.executeAIMove(), 800);
        } else {
          this.setMessage(`Select a pawn to advance ${sum} squares.`);
        }
      }, 400);
    }

    handlePawnClick(pId, pIdx) {
      const curP = this.activePlayerIndices[this.currentTurnIndex];
      if (pId !== curP || this.isAITurn()) return;
      const m = this.legalMoves.find(mv => mv.idx === pIdx);
      if (m) this.applyMove(curP, m);
    }

    executeAIMove() {
      const curP = this.activePlayerIndices[this.currentTurnIndex];
      if (this.legalMoves.length > 0) {
        // Prioritize capture moves, then farthest advance
        const captures = this.legalMoves.filter(m => m.isCapture);
        if (captures.length > 0) {
          this.applyMove(curP, captures[0]);
        } else {
          this.legalMoves.sort((a, b) => b.to - a.to);
          this.applyMove(curP, this.legalMoves[0]);
        }
      }
    }

    applyMove(pId, move) {
      this.pawnsState[pId][move.idx] = move.to;

      let capturedOpponent = false;
      if (move.to > 0 && move.to < 40) {
        this.activePlayerIndices.forEach(otherP => {
          if (otherP !== pId) {
            this.pawnsState[otherP].forEach((s, idx) => {
              if (s === move.to) {
                this.pawnsState[otherP][idx] = 0; // Send back to home yard
                capturedOpponent = true;
              }
            });
          }
        });
      }

      this.updatePawnPositions();

      if (this.pawnsState[pId].every(s => s === 40)) {
        this.winner = pId;
        this.setMessage(`🎉 ${PLAYER_CONFIG[pId].name} Wins Chaupar!`);
        return;
      }

      if (capturedOpponent) {
        this.setMessage(`💥 ${PLAYER_CONFIG[pId].nameShort} captured an opposing pawn!`);
      }

      setTimeout(() => this.passTurn(), capturedOpponent ? 900 : 600);
    }

    passTurn() {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.activePlayerIndices.length;
      this.updateHUD();
      const nextP = this.activePlayerIndices[this.currentTurnIndex];
      if (this.isAITurn()) {
        this.setMessage('AI casting Pasa dice...');
        setTimeout(() => this.triggerRoll(), 1000);
      } else {
        this.setMessage(`${PLAYER_CONFIG[nextP].nameShort}'s turn: Cast Pasa dice!`);
      }
    }

    isAITurn() {
      return this.gameMode === 'ai' && this.activePlayerIndices[this.currentTurnIndex] !== 0;
    }

    initDOMControls() {
      const rollBtn = document.getElementById('roll-dice-btn');
      if (rollBtn) rollBtn.addEventListener('click', () => this.triggerRoll());

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
      this.activePlayerIndices = [0, 1, 2, 3];
      this.currentTurnIndex = 0;
      this.winner = -1;
      this.pawnsState = { 0: [0,0,0,0], 1: [0,0,0,0], 2: [0,0,0,0], 3: [0,0,0,0] };
      this.updatePawnPositions();
      this.updateHUD();
      this.setMessage('Chaupar started! Cast 3 Pasa dice to begin.');
    }

    updateHUD() {
      const curP = this.activePlayerIndices[this.currentTurnIndex];
      const pConf = PLAYER_CONFIG[curP];
      const dot = document.getElementById('current-player-color-dot');
      const name = document.getElementById('current-player-name');
      if (dot) dot.style.background = pConf.hex;
      if (name) name.textContent = pConf.name;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new ChauparApp());
  else new ChauparApp();
})();
