/**
 * ==============================================================================
 * Mantrika Games — Pachisi 3D Handcrafted WebGL Engine
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

  class PachisiApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('pachisi-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.aiDifficulty = 'medium';
      this.numPlayers = 2;
      this.activePlayerIndices = [0, 2];
      this.currentTurnIndex = 0;
      this.pawnsState = { 0: [0,0,0,0], 2: [0,0,0,0] }; // Step 0 to 40 (40 = Charkoni)
      this.currentRoll = 0;
      this.cowrieFaces = [0,0,0,0,0,0];
      this.isRolling = false;
      this.winner = -1;
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
        progress += 20;
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
      }, 60);
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
      this.buildCowries();
      this.buildPawns();

      this.setupInteraction();
      this.animate();
    }

    buildBoard() {
      this.boardGroup = new THREE.Group();
      
      // Procedural Silk Velvet Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
      grad.addColorStop(0, '#5C2619');
      grad.addColorStop(1, '#3A140B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Gold stitched grid lines
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 3;
      for (let i = 64; i < 512; i += 64) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
      const silkTex = new THREE.CanvasTexture(canvas);

      // Cross shaped velvet base
      const mat = new THREE.MeshStandardMaterial({ map: silkTex, roughness: 0.45, metalness: 0.15 });
      const centerSlab = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 4), mat);
      centerSlab.position.y = -0.2;
      centerSlab.receiveShadow = true;
      this.boardGroup.add(centerSlab);

      // 4 Silk Board Arms
      const armGeo = new THREE.BoxGeometry(3.6, 0.35, 7.2);
      const armSouth = new THREE.Mesh(armGeo, mat);
      armSouth.position.set(0, -0.18, 5.6);
      armSouth.receiveShadow = true;
      const armNorth = new THREE.Mesh(armGeo, mat);
      armNorth.position.set(0, -0.18, -5.6);
      armNorth.receiveShadow = true;
      const armEast = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 3.6), mat);
      armEast.position.set(5.6, -0.18, 0);
      armEast.receiveShadow = true;
      const armWest = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 3.6), mat);
      armWest.position.set(-5.6, -0.18, 0);
      armWest.receiveShadow = true;

      this.boardGroup.add(armSouth, armNorth, armEast, armWest);

      // Gold embroidery trim
      const goldTrim = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.25 });
      const charkoni = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.42, 2.4), goldTrim);
      charkoni.position.y = -0.15;
      this.boardGroup.add(charkoni);

      this.scene.add(this.boardGroup);
    }

    buildCowries() {
      this.cowriesGroup = new THREE.Group();
      this.cowriesGroup.position.set(7.5, 0.1, 7.5);
      this.cowrieMeshes = [];

      const cowrieMat = new THREE.MeshStandardMaterial({ color: 0xF7F4EB, roughness: 0.2 });
      for (let i = 0; i < 6; i++) {
        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), cowrieMat);
        shell.scale.set(1.2, 0.6, 0.8);
        const angle = (i / 6) * Math.PI * 2;
        shell.position.set(Math.cos(angle) * 0.75, 0.15, Math.sin(angle) * 0.75);
        this.cowriesGroup.add(shell);
        this.cowrieMeshes.push(shell);
      }
      this.scene.add(this.cowriesGroup);
    }

    buildPawns() {
      this.pawnsGroup = new THREE.Group();
      this.pawnMeshes = {};
      this.scene.add(this.pawnsGroup);
    }

    updatePawnPositions() {
      while (this.pawnsGroup.children.length > 0) {
        this.pawnsGroup.remove(this.pawnsGroup.children[0]);
      }
      this.pawnMeshes = {};

      this.activePlayerIndices.forEach(pId => {
        const pConf = PLAYER_CONFIG[pId];
        const mat = new THREE.MeshStandardMaterial({ color: pConf.color, roughness: 0.3, metalness: 0.2 });

        this.pawnsState[pId].forEach((step, pIdx) => {
          const pawn = new THREE.Group();
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.8, 16), mat);
          body.position.y = 0.4;
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mat);
          head.position.y = 0.85;
          pawn.add(body, head);

          // Calculate 3D position along cross path
          const pos = this.stepToWorld(pId, step, pIdx);
          pawn.position.set(pos.x, pos.y, pos.z);
          pawn.userData = { pId, pIdx };

          this.pawnsGroup.add(pawn);
          this.pawnMeshes[`${pId}_${pIdx}`] = pawn;
        });
      });
    }

    stepToWorld(pId, step, pIdx) {
      if (step === 0) {
        // In home yard
        const angle = (pId * Math.PI / 2) + (pIdx * 0.4) - 0.6;
        return { x: Math.cos(angle) * 6.5, y: 0.05, z: Math.sin(angle) * 6.5 };
      }
      if (step >= 40) {
        // In Charkoni center
        return { x: (pIdx % 2 === 0 ? 0.4 : -0.4), y: 0.1, z: (pIdx >= 2 ? 0.4 : -0.4) };
      }
      // Traveling along arm
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
        const hits = this.raycaster.intersectObjects(this.pawnsGroup.children, true);
        if (hits.length > 0) {
          let root = hits[0].object;
          while (root.parent && root.parent !== this.pawnsGroup) root = root.parent;
          if (root.userData && typeof root.userData.pIdx !== 'undefined') {
            this.handlePawnClick(root.userData.pId, root.userData.pIdx);
          }
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
      this.activePlayerIndices = this.numPlayers === 2 ? [0, 2] : [0, 1, 2, 3];
      this.pawnsState = {};
      this.activePlayerIndices.forEach(p => this.pawnsState[p] = [0,0,0,0]);
      this.currentTurnIndex = 0;
      this.winner = -1;
      this.updatePawnPositions();
      this.updateHUD();
      this.setMessage('Pachisi started! Cast the 6 cowries.');
    }

    triggerRoll() {
      if (this.isRolling || this.winner !== -1) return;
      this.isRolling = true;
      let openCount = 0;
      this.cowrieFaces = [];
      for (let i = 0; i < 6; i++) {
        const face = Math.random() < 0.5 ? 1 : 0;
        this.cowrieFaces.push(face);
        if (face === 1) openCount++;
      }

      let score = 2;
      let isBonus = false;
      switch(openCount) {
        case 5: score = 25; isBonus = true; break; // Pachis (Grace)
        case 1: score = 10; isBonus = true; break;
        case 2: score = 2; break;
        case 3: score = 3; break;
        case 4: score = 4; break;
        case 6: score = 6; isBonus = true; break;
        case 0: score = 6; isBonus = true; break;
      }
      this.currentRoll = score;

      setTimeout(() => {
        this.isRolling = false;
        const rollValEl = document.getElementById('roll-number-val');
        if (rollValEl) rollValEl.textContent = score;

        const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
        this.legalMoves = [];
        const SAFE_STEPS = [0, 12, 17, 24, 40];

        this.pawnsState[curPlayer].forEach((step, pIdx) => {
          if (step < 40 && step + score <= 40) {
            const targetStep = step + score;
            let isCapture = false;
            if (targetStep > 0 && targetStep < 40 && !SAFE_STEPS.includes(targetStep)) {
              this.activePlayerIndices.forEach(otherP => {
                if (otherP !== curPlayer && this.pawnsState[otherP].includes(targetStep)) {
                  isCapture = true;
                }
              });
            }
            this.legalMoves.push({ pIdx, from: step, to: targetStep, isCapture });
          }
        });

        if (this.legalMoves.length === 0) {
          this.setMessage(`No legal move for ${score}. Passing turn...`);
          setTimeout(() => this.passTurn(), 1000);
        } else if (this.isAITurn()) {
          setTimeout(() => this.executeAIMove(), 800);
        } else {
          this.setMessage(`Select a highlighted pawn to advance ${score} steps.`);
        }
      }, 500);
    }

    handlePawnClick(pId, pIdx) {
      const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
      if (pId !== curPlayer || this.isAITurn()) return;
      const move = this.legalMoves.find(m => m.pIdx === pIdx);
      if (move) this.applyMove(curPlayer, move);
    }

    executeAIMove() {
      const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
      if (this.legalMoves.length > 0) {
        // Prioritize capture moves
        const captures = this.legalMoves.filter(m => m.isCapture);
        if (captures.length > 0) {
          this.applyMove(curPlayer, captures[0]);
        } else {
          this.applyMove(curPlayer, this.legalMoves[0]);
        }
      }
    }

    applyMove(pId, move) {
      this.pawnsState[pId][move.pIdx] = move.to;

      const SAFE_STEPS = [0, 12, 17, 24, 40];
      let capturedOpponent = false;
      if (move.to > 0 && move.to < 40 && !SAFE_STEPS.includes(move.to)) {
        this.activePlayerIndices.forEach(otherP => {
          if (otherP !== pId) {
            this.pawnsState[otherP].forEach((s, idx) => {
              if (s === move.to) {
                this.pawnsState[otherP][idx] = 0; // Send captured pawn back home
                capturedOpponent = true;
              }
            });
          }
        });
      }

      this.updatePawnPositions();

      if (this.pawnsState[pId].every(s => s === 40)) {
        this.winner = pId;
        this.setMessage(`🎉 ${PLAYER_CONFIG[pId].name} Wins Pachisi!`);
        return;
      }

      if (capturedOpponent) {
        this.setMessage(`💥 ${PLAYER_CONFIG[pId].nameShort} captured an opposing pawn!`);
      }

      if (this.currentRoll === 25 || this.currentRoll === 10 || this.currentRoll === 6) {
        this.setMessage(`${PLAYER_CONFIG[pId].nameShort} rolled ${this.currentRoll} and earned an EXTRA ROLL!`);
        if (this.isAITurn()) setTimeout(() => this.triggerRoll(), 1000);
      } else {
        setTimeout(() => this.passTurn(), capturedOpponent ? 900 : 600);
      }
    }
      } else {
        setTimeout(() => this.passTurn(), 600);
      }
    }

    passTurn() {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.activePlayerIndices.length;
      this.updateHUD();
      const nextPlayer = this.activePlayerIndices[this.currentTurnIndex];
      if (this.isAITurn()) {
        this.setMessage('AI is rolling cowries...');
        setTimeout(() => this.triggerRoll(), 1000);
      } else {
        this.setMessage(`${PLAYER_CONFIG[nextPlayer].nameShort}'s turn: Cast cowries!`);
      }
    }

    isAITurn() {
      return this.gameMode === 'ai' && this.activePlayerIndices[this.currentTurnIndex] !== 0;
    }

    updateHUD() {
      const curPlayerId = this.activePlayerIndices[this.currentTurnIndex];
      const pConf = PLAYER_CONFIG[curPlayerId];
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PachisiApp());
  } else {
    new PachisiApp();
  }
})();
