/**
 * ==============================================================================
 * Mantrika Games — Chowka Bara 3D Handcrafted WebGL Engine
 * ==============================================================================
 * A physically based 3D board game engine built with Three.js.
 * Features realistic handcrafted Sheesham wood, brass inlays, 3D cowrie shells,
 * multi-tier AI (Easy, Medium, Master), local multiplayer, and touch gestures.
 */

(function() {
  'use strict';

  // --- Constants & Config ---
  const BOARD_SIZE = 5;
  const CELL_WIDTH = 2.0;
  const BOARD_SPAN = BOARD_SIZE * CELL_WIDTH;
  const HALF_SPAN = BOARD_SPAN / 2;

  // Safe Katta Coordinates (row, col)
  const SAFE_CELLS = [
    { r: 4, c: 2 }, // South (Player 0)
    { r: 2, c: 4 }, // East (Player 1)
    { r: 0, c: 2 }, // North (Player 2)
    { r: 2, c: 0 }, // West (Player 3)
    { r: 2, c: 2 }  // Central Ghar
  ];

  // Distinct Player Palette (Lacquered Finish)
  const PLAYER_CONFIG = [
    { id: 0, name: 'Player 1 (South)', color: 0xB91C1C, hex: '#B91C1C', nameShort: 'Crimson' },
    { id: 1, name: 'Player 2 (East)',  color: 0xD97706, hex: '#D97706', nameShort: 'Saffron' },
    { id: 2, name: 'Player 3 (North)', color: 0x047857, hex: '#047857', nameShort: 'Emerald' },
    { id: 3, name: 'Player 4 (West)',  color: 0x1D4ED8, hex: '#1D4ED8', nameShort: 'Lapis' }
  ];

  // Precalculated paths for each player from home base (step 0) to Ghar (step 24)
  const PLAYER_PATHS = {
    0: [
      {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:3,c:4},
      {r:2,c:4}, {r:1,c:4}, {r:0,c:4}, {r:0,c:3},
      {r:0,c:2}, {r:0,c:1}, {r:0,c:0}, {r:1,c:0},
      {r:2,c:0}, {r:3,c:0}, {r:4,c:0}, {r:4,c:1},
      {r:3,c:1}, {r:3,c:2}, {r:3,c:3}, {r:2,c:3},
      {r:1,c:3}, {r:1,c:2}, {r:1,c:1}, {r:2,c:1},
      {r:2,c:2}
    ],
    1: [
      {r:2,c:4}, {r:1,c:4}, {r:0,c:4}, {r:0,c:3},
      {r:0,c:2}, {r:0,c:1}, {r:0,c:0}, {r:1,c:0},
      {r:2,c:0}, {r:3,c:0}, {r:4,c:0}, {r:4,c:1},
      {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:3,c:4},
      {r:3,c:3}, {r:2,c:3}, {r:1,c:3}, {r:1,c:2},
      {r:1,c:1}, {r:2,c:1}, {r:3,c:1}, {r:3,c:2},
      {r:2,c:2}
    ],
    2: [
      {r:0,c:2}, {r:0,c:1}, {r:0,c:0}, {r:1,c:0},
      {r:2,c:0}, {r:3,c:0}, {r:4,c:0}, {r:4,c:1},
      {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:3,c:4},
      {r:2,c:4}, {r:1,c:4}, {r:0,c:4}, {r:0,c:3},
      {r:1,c:3}, {r:1,c:2}, {r:1,c:1}, {r:2,c:1},
      {r:3,c:1}, {r:3,c:2}, {r:3,c:3}, {r:2,c:3},
      {r:2,c:2}
    ],
    3: [
      {r:2,c:0}, {r:3,c:0}, {r:4,c:0}, {r:4,c:1},
      {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:3,c:4},
      {r:2,c:4}, {r:1,c:4}, {r:0,c:4}, {r:0,c:3},
      {r:0,c:2}, {r:0,c:1}, {r:0,c:0}, {r:1,c:0},
      {r:1,c:1}, {r:2,c:1}, {r:3,c:1}, {r:3,c:2},
      {r:3,c:3}, {r:2,c:3}, {r:1,c:3}, {r:1,c:2},
      {r:2,c:2}
    ]
  };

  // --- Procedural Web Audio Synthesizer ---
  class SoundEngine {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playWoodTap(pitch = 1.0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    }

    playDiceRattle() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.05);
        }, i * 60 + Math.random() * 30);
      }
    }

    playCapture() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    }

    playFanfare() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.4);
        }, idx * 120);
      });
    }
  }

  // --- 3D Texture & Procedural Material Generator ---
  function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm deep Rosewood base
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
    grad.addColorStop(0, '#5C3826');
    grad.addColorStop(0.5, '#442617');
    grad.addColorStop(1, '#2E180E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Natural wood grain rings
    ctx.strokeStyle = 'rgba(25, 10, 5, 0.12)';
    ctx.lineWidth = 2;
    for (let r = 10; r < 400; r += 6 + Math.random() * 4) {
      ctx.beginPath();
      ctx.ellipse(256, 256, r, r * 0.85, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Subtle grain streaks
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(210, 160, 90, 0.03)';
      ctx.fillRect(Math.random() * 512, 0, Math.random() * 3 + 1, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // --- Main 3D Chowka Bara Application ---
  class ChowkaBaraApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('chowka-bara-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.audio = new SoundEngine();
      this.animatingPawns = [];
      this.highlightMeshes = [];

      // Game state
      this.gameMode = 'ai'; // 'ai' or 'local'
      this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
      this.numPlayers = 2;
      this.activePlayerIndices = [0, 2];
      this.currentTurnIndex = 0; // index into activePlayerIndices
      this.pawnsState = {}; // player -> [step0, step1, step2, step3]
      this.hasCaptured = {}; // player -> bool
      this.currentRoll = 0;
      this.cowrieFaces = [0, 0, 0, 0];
      this.isRolling = false;
      this.isAIThinking = false;
      this.winner = -1;
      this.legalMoves = [];

      // Three.js Core
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.boardGroup = null;
      this.pawnsGroup = null;
      this.cowriesGroup = null;
      this.pawnMeshes = {}; // "p_pawnIdx" -> mesh

      // Orbital Camera State
      this.camTarget = new THREE.Vector3(0, 0, 0);
      this.camYaw = 0;
      this.camPitch = 0.95;
      this.camDistance = 18;
      this.targetYaw = 0;
      this.targetPitch = 0.95;
      this.targetDistance = 18;
      this.isPointerDown = false;
      this.pointerStart = { x: 0, y: 0 };
      this.pinchStartDist = 0;

      // Raycaster for piece interaction
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      this.initLoadingSimulation();
    }

    initLoadingSimulation() {
      const progressFill = document.getElementById('loading-progress-fill');
      const progressPct = document.getElementById('loading-percentage');
      const statusText = document.getElementById('loading-status-text');
      const overlay = document.getElementById('game-loading-overlay');
      const hud = document.getElementById('game-hud-overlay');

      const tips = [
        'Carving 5x5 Sheesham Board...',
        'Inlaying Antique Brass Grid & Kattas...',
        'Turning Royal Lacquered Pawns...',
        'Polishing 4 Natural Cowrie Shells...',
        'Ready for Traditional Strategy!'
      ];

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 10;
        if (progress > 100) progress = 100;

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressPct) progressPct.textContent = `${progress}%`;
        
        const tipIdx = Math.min(Math.floor((progress / 100) * tips.length), tips.length - 1);
        if (statusText) statusText.textContent = tips[tipIdx];

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (overlay) {
              overlay.style.opacity = '0';
              setTimeout(() => {
                overlay.style.display = 'none';
                if (hud) hud.style.display = 'flex';
                this.initThree();
                this.initDOMControls();
              }, 600);
            }
          }, 300);
        }
      }, 80);
    }

    initThree() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x130F0D);

      // Camera
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      this.updateCameraPos();

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // High-End Studio Lighting (Warm Royal Pavilion Lighting)
      const ambientLight = new THREE.AmbientLight(0xFFE8D6, 0.75);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xFFF2DC, 1.35);
      dirLight.position.set(12, 20, 14);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.bias = -0.0001;
      dirLight.shadow.radius = 2;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 60;
      const d = 14;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      this.scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x7A9EC2, 0.4);
      fillLight.position.set(-10, 12, -10);
      this.scene.add(fillLight);

      const rimLight = new THREE.SpotLight(0xD4AF37, 0.8);
      rimLight.position.set(0, 22, -16);
      rimLight.angle = Math.PI / 3;
      rimLight.penumbra = 0.8;
      this.scene.add(rimLight);

      // Floating Ambient Gold Dust Motes Particle System
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = 90;
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

      // Build 3D Game Objects
      this.build3DBoard();
      this.build3DCowries();
      this.build3DPawns();

      // Attach Resize and Input Event Listeners
      window.addEventListener('resize', () => this.onWindowResize());
      this.setupInteractionListeners();

      // Render Loop
      this.animate();
    }

    build3DBoard() {
      this.boardGroup = new THREE.Group();
      const woodTex = createWoodTexture();

      // 1. Base Wooden Slab
      const boardGeo = new THREE.BoxGeometry(BOARD_SPAN + 1.2, 0.6, BOARD_SPAN + 1.2);
      const boardMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.4,
        metalness: 0.1,
        color: 0x5C3826
      });
      const boardMesh = new THREE.Mesh(boardGeo, boardMat);
      boardMesh.position.y = -0.3;
      boardMesh.receiveShadow = true;
      this.boardGroup.add(boardMesh);

      // 2. Brass Rim / Border Inlay
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        roughness: 0.25,
        metalness: 0.85
      });

      const borderThickness = 0.08;
      const borderHeight = 0.04;
      
      // Outer brass border lines
      const borderGeoX = new THREE.BoxGeometry(BOARD_SPAN + 0.2, borderHeight, borderThickness);
      const bNorth = new THREE.Mesh(borderGeoX, rimMat);
      bNorth.position.set(0, 0.02, -HALF_SPAN - 0.04);
      const bSouth = new THREE.Mesh(borderGeoX, rimMat);
      bSouth.position.set(0, 0.02, HALF_SPAN + 0.04);
      this.boardGroup.add(bNorth, bSouth);

      const borderGeoZ = new THREE.BoxGeometry(borderThickness, borderHeight, BOARD_SPAN + 0.2);
      const bEast = new THREE.Mesh(borderGeoZ, rimMat);
      bEast.position.set(HALF_SPAN + 0.04, 0.02, 0);
      const bWest = new THREE.Mesh(borderGeoZ, rimMat);
      bWest.position.set(-HALF_SPAN - 0.04, 0.02, 0);
      this.boardGroup.add(bEast, bWest);

      // 3. Grid Lines & Cell Squares
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0xC89B3C,
        roughness: 0.3,
        metalness: 0.8
      });

      // Internal grid lines
      for (let i = 1; i < BOARD_SIZE; i++) {
        const offset = -HALF_SPAN + i * CELL_WIDTH;
        // Horizontal line
        const hLine = new THREE.Mesh(new THREE.BoxGeometry(BOARD_SPAN, 0.02, 0.04), lineMat);
        hLine.position.set(0, 0.01, offset);
        // Vertical line
        const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, BOARD_SPAN), lineMat);
        vLine.position.set(offset, 0.01, 0);
        this.boardGroup.add(hLine, vLine);
      }

      // 4. Safe Kattas (Carved 'X' Motifs on Safe Squares)
      SAFE_CELLS.forEach(cell => {
        const pos = this.gridToWorld(cell.r, cell.c);
        const crossLength = CELL_WIDTH * 0.75;
        const crossGeo = new THREE.BoxGeometry(crossLength, 0.025, 0.08);

        const bar1 = new THREE.Mesh(crossGeo, rimMat);
        bar1.position.set(pos.x, 0.015, pos.z);
        bar1.rotation.y = Math.PI / 4;

        const bar2 = new THREE.Mesh(crossGeo, rimMat);
        bar2.position.set(pos.x, 0.015, pos.z);
        bar2.rotation.y = -Math.PI / 4;

        this.boardGroup.add(bar1, bar2);

        // Center Ghar decorative concentric diamond
        if (cell.r === 2 && cell.c === 2) {
          const gharDiamond = new THREE.Mesh(new THREE.BoxGeometry(CELL_WIDTH * 0.45, 0.025, CELL_WIDTH * 0.45), lineMat);
          gharDiamond.position.set(pos.x, 0.012, pos.z);
          gharDiamond.rotation.y = Math.PI / 4;
          this.boardGroup.add(gharDiamond);
        }
      });

      // 5. Corner Brass Brackets
      const cornerSize = 0.6;
      const cornerGeo = new THREE.BoxGeometry(cornerSize, 0.05, cornerSize);
      const corners = [
        { x: -HALF_SPAN - 0.3, z: -HALF_SPAN - 0.3 },
        { x: HALF_SPAN + 0.3,  z: -HALF_SPAN - 0.3 },
        { x: -HALF_SPAN - 0.3, z: HALF_SPAN + 0.3 },
        { x: HALF_SPAN + 0.3,  z: HALF_SPAN + 0.3 }
      ];
      corners.forEach(c => {
        const cornerMesh = new THREE.Mesh(cornerGeo, rimMat);
        cornerMesh.position.set(c.x, 0.02, c.z);
        this.boardGroup.add(cornerMesh);
      });

      this.scene.add(this.boardGroup);
    }

    build3DCowries() {
      this.cowriesGroup = new THREE.Group();
      this.cowriesGroup.position.set(HALF_SPAN + 2.5, 0.1, 0); // Positioned in brass tray beside board

      // Brass Dice Tray
      const trayGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.25, 32);
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x997528,
        roughness: 0.3,
        metalness: 0.85
      });
      const tray = new THREE.Mesh(trayGeo, trayMat);
      tray.position.y = -0.12;
      tray.receiveShadow = true;
      this.cowriesGroup.add(tray);

      // 4 Realistic 3D Cowrie Shells
      this.cowrieMeshes = [];
      const cowrieMat = new THREE.MeshStandardMaterial({
        color: 0xF7F4EB,
        roughness: 0.2,
        metalness: 0.05
      });

      for (let i = 0; i < 4; i++) {
        const shellGroup = new THREE.Group();
        
        // Dorsal shell back (smooth dome)
        const domeGeo = new THREE.SphereGeometry(0.35, 16, 12);
        domeGeo.scale(1.3, 0.6, 0.9);
        const dome = new THREE.Mesh(domeGeo, cowrieMat);
        dome.castShadow = true;
        shellGroup.add(dome);

        // Ventral slit/mouth (dark inlay line)
        const slitGeo = new THREE.BoxGeometry(0.5, 0.05, 0.08);
        const slitMat = new THREE.MeshBasicMaterial({ color: 0x3D2418 });
        const slit = new THREE.Mesh(slitGeo, slitMat);
        slit.position.y = -0.15;
        shellGroup.add(slit);

        const angle = (i / 4) * Math.PI * 2;
        shellGroup.position.set(Math.cos(angle) * 0.9, 0.2, Math.sin(angle) * 0.9);
        this.cowriesGroup.add(shellGroup);
        this.cowrieMeshes.push(shellGroup);
      }

      this.scene.add(this.cowriesGroup);
    }

    build3DPawns() {
      this.pawnsGroup = new THREE.Group();
      this.scene.add(this.pawnsGroup);
    }

    createPawnMesh(playerId, pawnIdx) {
      const pConf = PLAYER_CONFIG[playerId];
      const pawnGroup = new THREE.Group();

      const mat = new THREE.MeshStandardMaterial({
        color: pConf.color,
        roughness: 0.25,
        metalness: 0.25
      });

      // 1. Pedestal Base
      const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.2, 16);
      const base = new THREE.Mesh(baseGeo, mat);
      base.position.y = 0.1;
      base.castShadow = true;
      pawnGroup.add(base);

      // 2. Tapered Waist Body
      const waistGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.45, 16);
      const waist = new THREE.Mesh(waistGeo, mat);
      waist.position.y = 0.4;
      waist.castShadow = true;
      pawnGroup.add(waist);

      // 3. Domed Finial Head
      const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 0.75;
      head.castShadow = true;
      pawnGroup.add(head);

      // 4. Brass Ring Inlay Collar
      const ringGeo = new THREE.TorusGeometry(0.2, 0.035, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.62;
      pawnGroup.add(ring);

      pawnGroup.userData = { playerId, pawnIdx };
      return pawnGroup;
    }

    gridToWorld(r, c, stackOffset = 0) {
      const x = -HALF_SPAN + c * CELL_WIDTH + CELL_WIDTH / 2;
      const z = -HALF_SPAN + r * CELL_WIDTH + CELL_WIDTH / 2;
      return {
        x: x + (stackOffset % 2 === 1 ? 0.22 : -0.22) * Math.min(stackOffset, 1),
        y: 0.05,
        z: z + (stackOffset >= 2 ? 0.22 : -0.22) * Math.min(stackOffset, 1)
      };
    }

    updatePawnPositions3D() {
      // Clear existing pawns
      while (this.pawnsGroup.children.length > 0) {
        this.pawnsGroup.remove(this.pawnsGroup.children[0]);
      }
      this.pawnMeshes = {};

      // Group pawns by cell coordinate to calculate visual stacking
      const cellOccupants = {};

      this.activePlayerIndices.forEach(pId => {
        const steps = this.pawnsState[pId];
        steps.forEach((step, pawnIdx) => {
          const path = PLAYER_PATHS[pId];
          const coord = path[step];
          const key = `${coord.r}_${coord.c}`;
          if (!cellOccupants[key]) cellOccupants[key] = [];
          cellOccupants[key].push({ pId, pawnIdx, step });
        });
      });

      // Render each pawn at its calculated offset
      Object.keys(cellOccupants).forEach(key => {
        const occupants = cellOccupants[key];
        occupants.forEach((occ, idx) => {
          const path = PLAYER_PATHS[occ.pId];
          const coord = path[occ.step];
          const pos = this.gridToWorld(coord.r, coord.c, occupants.length > 1 ? idx : 0);

          const mesh = this.createPawnMesh(occ.pId, occ.pawnIdx);
          mesh.position.set(pos.x, pos.y, pos.z);
          this.pawnsGroup.add(mesh);
          this.pawnMeshes[`${occ.pId}_${occ.pawnIdx}`] = mesh;
        });
      });
    }

    setupInteractionListeners() {
      // Pointer & Touch orbital camera
      this.canvas.addEventListener('pointerdown', (e) => {
        this.isPointerDown = true;
        this.pointerStart = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isPointerDown) return;
        const dx = e.clientX - this.pointerStart.x;
        const dy = e.clientY - this.pointerStart.y;
        this.targetYaw -= dx * 0.006;
        this.targetPitch = Math.max(0.3, Math.min(1.4, this.targetPitch + dy * 0.006));
        this.pointerStart = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('pointerup', () => {
        this.isPointerDown = false;
      });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.targetDistance = Math.max(10, Math.min(30, this.targetDistance + e.deltaY * 0.015));
      }, { passive: false });

      // Click on pawns to move
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.pawnsGroup.children, true);

        if (intersects.length > 0) {
          let root = intersects[0].object;
          while (root.parent && root.parent !== this.pawnsGroup) {
            root = root.parent;
          }
          if (root.userData && typeof root.userData.pawnIdx !== 'undefined') {
            this.handlePawnClicked(root.userData.playerId, root.userData.pawnIdx);
          }
        }
      });
    }

    initDOMControls() {
      // Sound Toggle Button
      const soundBtn = document.getElementById('toggle-sound-btn');
      const soundOnIcon = document.getElementById('sound-icon-on');
      const soundOffIcon = document.getElementById('sound-icon-off');
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          this.audio.enabled = !this.audio.enabled;
          if (soundOnIcon) soundOnIcon.style.display = this.audio.enabled ? 'block' : 'none';
          if (soundOffIcon) soundOffIcon.style.display = this.audio.enabled ? 'none' : 'block';
        });
      }

      // Reset Camera Button
      const resetCamBtn = document.getElementById('reset-cam-btn');
      if (resetCamBtn) {
        resetCamBtn.addEventListener('click', () => {
          this.targetYaw = 0;
          this.targetPitch = 0.95;
          this.targetDistance = 18;
        });
      }

      // Fullscreen Button
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            this.container.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        });
      }

      // Roll Dice Button
      const rollBtn = document.getElementById('roll-dice-btn');
      if (rollBtn) {
        rollBtn.addEventListener('click', () => {
          this.triggerRoll();
        });
      }

      // Setup Modal Handlers
      const setupModal = document.getElementById('game-setup-modal');
      const modeBtns = document.querySelectorAll('.mode-btn');
      const diffBtns = document.querySelectorAll('.diff-btn');
      const playerCountBtns = document.querySelectorAll('.players-count-btn');
      const startBtn = document.getElementById('start-game-btn');
      const diffGroup = document.getElementById('ai-difficulty-group');

      modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          modeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.gameMode = btn.getAttribute('data-mode');
          if (diffGroup) {
            diffGroup.style.display = this.gameMode === 'ai' ? 'block' : 'none';
          }
        });
      });

      diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          diffBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.aiDifficulty = btn.getAttribute('data-diff');
        });
      });

      playerCountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          playerCountBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.numPlayers = parseInt(btn.getAttribute('data-players'), 10);
        });
      });

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (setupModal) setupModal.style.display = 'none';
          this.startNewGame();
        });
      }

      // Victory Modal Action Buttons
      const playAgainBtn = document.getElementById('play-again-btn');
      const exitMenuBtn = document.getElementById('exit-to-menu-btn');
      const victoryModal = document.getElementById('game-victory-modal');

      if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
          if (victoryModal) victoryModal.style.display = 'none';
          this.startNewGame();
        });
      }

      if (exitMenuBtn) {
        exitMenuBtn.addEventListener('click', () => {
          if (victoryModal) victoryModal.style.display = 'none';
          if (setupModal) setupModal.style.display = 'flex';
        });
      }
    }

    startNewGame() {
      if (this.numPlayers === 2) {
        this.activePlayerIndices = [0, 2]; // South & North
      } else {
        this.activePlayerIndices = [0, 1, 2, 3];
      }

      this.currentTurnIndex = 0;
      this.pawnsState = {};
      this.hasCaptured = {};
      this.winner = -1;
      this.currentRoll = 0;
      this.legalMoves = [];
      this.isRolling = false;
      this.isAIThinking = false;

      this.activePlayerIndices.forEach(pId => {
        this.pawnsState[pId] = [0, 0, 0, 0];
        this.hasCaptured[pId] = false;
      });

      this.updatePawnPositions3D();
      this.updateHUD();
      this.clearHighlights();
      this.setMessage('Game started! Cast the 4 cowries to begin.');
      this.enableRollButton(true);
    }

    triggerRoll() {
      if (this.isRolling || this.winner !== -1) return;
      this.isRolling = true;
      this.enableRollButton(false);
      this.clearHighlights();

      this.audio.playDiceRattle();

      // Animate 3D cowries rolling
      const rollDuration = 600;
      const startTime = performance.now();

      // Calculate roll outcome (4 cowries)
      let openCount = 0;
      this.cowrieFaces = [];
      for (let i = 0; i < 4; i++) {
        const face = Math.random() < 0.5 ? 1 : 0;
        this.cowrieFaces.push(face);
        if (face === 1) openCount++;
      }

      let score = 0;
      let isBonus = false;
      switch (openCount) {
        case 1: score = 1; break;
        case 2: score = 2; break;
        case 3: score = 3; break;
        case 4: score = 4; isBonus = true; break; // Chowka
        case 0: score = 8; isBonus = true; break; // Ashta / Bara
      }
      this.currentRoll = score;

      const animateRoll = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / rollDuration, 1.0);

        this.cowrieMeshes.forEach((mesh, idx) => {
          if (t < 1.0) {
            mesh.rotation.x += 0.3;
            mesh.rotation.z += 0.2;
            mesh.position.y = 0.2 + Math.sin(t * Math.PI) * 0.8;
          } else {
            // Settle on face
            const isOpen = this.cowrieFaces[idx] === 1;
            mesh.rotation.set(isOpen ? Math.PI : 0, 0, 0);
            mesh.position.y = 0.15;
          }
        });

        if (t < 1.0) {
          requestAnimationFrame(animateRoll);
        } else {
          this.isRolling = false;
          this.onRollSettled(score, isBonus);
        }
      };
      requestAnimationFrame(animateRoll);
    }

    onRollSettled(score, isBonus) {
      // Update mini cowrie display
      for (let i = 0; i < 4; i++) {
        const el = document.getElementById(`cowrie-${i + 1}`);
        if (el) el.textContent = this.cowrieFaces[i] === 1 ? '🐚' : '🟤';
      }

      const rollValEl = document.getElementById('roll-number-val');
      const rollTitleEl = document.getElementById('roll-title-val');
      if (rollValEl) rollValEl.textContent = score;
      if (rollTitleEl) {
        if (score === 4) rollTitleEl.textContent = 'CHOWKA (Bonus!)';
        else if (score === 8) rollTitleEl.textContent = 'ASHTA (Bonus!)';
        else rollTitleEl.textContent = `${score} Points`;
      }

      const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
      this.legalMoves = this.calculateLegalMoves(curPlayer, score);

      if (this.legalMoves.length === 0) {
        this.setMessage(`No legal moves for ${score}. Passing turn...`);
        setTimeout(() => this.passTurn(), 1200);
      } else if (this.isAITurn()) {
        this.setMessage(`AI is calculating tactical move...`);
        setTimeout(() => this.executeAIMove(), 800);
      } else {
        this.setMessage(`Select a highlighted pawn to move ${score} squares.`);
        this.showMoveHighlights(curPlayer, this.legalMoves);
      }
    }

    calculateLegalMoves(playerId, rollValue) {
      const moves = [];
      const pawns = this.pawnsState[playerId];
      const canEnterInner = this.hasCaptured[playerId];

      pawns.forEach((currentStep, pawnIdx) => {
        if (currentStep >= 24) return; // already in Ghar

        let targetStep = currentStep + rollValue;

        // If not unlocked inner loop, loop outer 16 squares
        if (!canEnterInner && targetStep > 15) {
          targetStep = targetStep % 16;
        }

        if (targetStep > 24) return; // exact roll to Ghar required

        const path = PLAYER_PATHS[playerId];
        const toCoord = path[targetStep];
        const isSafe = this.isCellSafe(toCoord);

        let isCapture = false;
        let oppData = null;

        if (!isSafe && targetStep < 24) {
          for (let oppId of this.activePlayerIndices) {
            if (oppId === playerId) continue;
            const oppPawns = this.pawnsState[oppId];
            oppPawns.forEach((oppStep, oppPawnIdx) => {
              if (oppStep < 24) {
                const oppCoord = PLAYER_PATHS[oppId][oppStep];
                if (oppCoord.r === toCoord.r && oppCoord.c === toCoord.c) {
                  isCapture = true;
                  oppData = { oppPlayer: oppId, oppPawnIdx };
                }
              }
            });
          }
        }

        moves.push({
          pawnIdx,
          fromStep: currentStep,
          toStep: targetStep,
          toCoord,
          isCapture,
          oppData,
          reachesGhar: (targetStep === 24)
        });
      });

      return moves;
    }

    isCellSafe(coord) {
      return SAFE_CELLS.some(sc => sc.r === coord.r && sc.c === coord.c);
    }

    showMoveHighlights(playerId, moves) {
      this.clearHighlights();
      const highlightMat = new THREE.MeshBasicMaterial({
        color: 0xF59E0B,
        transparent: true,
        opacity: 0.6
      });

      moves.forEach(m => {
        const mesh = this.pawnMeshes[`${playerId}_${m.pawnIdx}`];
        if (mesh) {
          const ringGeo = new THREE.RingGeometry(0.35, 0.48, 24);
          const ring = new THREE.Mesh(ringGeo, highlightMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(mesh.position.x, 0.06, mesh.position.z);
          this.scene.add(ring);
          this.highlightMeshes.push(ring);
        }
      });
    }

    clearHighlights() {
      this.highlightMeshes.forEach(m => this.scene.remove(m));
      this.highlightMeshes = [];
    }

    handlePawnClicked(playerId, pawnIdx) {
      const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
      if (playerId !== curPlayer || this.isAITurn() || this.isRolling) return;

      const matchingMove = this.legalMoves.find(m => m.pawnIdx === pawnIdx);
      if (matchingMove) {
        this.executeMove(curPlayer, matchingMove);
      }
    }

    executeMove(playerId, move) {
      this.clearHighlights();
      const pawnIdx = move.pawnIdx;
      const toStep = move.toStep;
      this.pawnsState[playerId][pawnIdx] = toStep;

      this.audio.playWoodTap(1.2);

      let earnedExtraTurn = (this.currentRoll === 4 || this.currentRoll === 8);

      if (move.isCapture && move.oppData) {
        const opp = move.oppData;
        this.pawnsState[opp.oppPlayer][opp.oppPawnIdx] = 0;
        this.hasCaptured[playerId] = true;
        earnedExtraTurn = true;
        this.audio.playCapture();
        this.setMessage(`${PLAYER_CONFIG[playerId].nameShort} captured an opponent piece! Inner sanctum unlocked! Extra turn!`);
      }

      // Check win
      const allHome = this.pawnsState[playerId].every(s => s === 24);
      this.updatePawnPositions3D();

      if (allHome) {
        this.winner = playerId;
        this.audio.playFanfare();
        this.showVictoryModal(playerId);
        return;
      }

      if (earnedExtraTurn) {
        this.setMessage(`${PLAYER_CONFIG[playerId].nameShort} earned an EXTRA ROLL!`);
        if (this.isAITurn()) {
          setTimeout(() => this.triggerRoll(), 1000);
        } else {
          this.enableRollButton(true);
        }
      } else {
        setTimeout(() => this.passTurn(), 600);
      }
    }

    executeAIMove() {
      const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
      if (this.legalMoves.length === 0) return;

      let chosenMove = this.legalMoves[0];

      if (this.aiDifficulty === 'easy') {
        // Random
        chosenMove = this.legalMoves[Math.floor(Math.random() * this.legalMoves.length)];
      } else {
        // Tactical Heuristic / Expectimax Evaluation
        let bestScore = -999999;
        this.legalMoves.forEach(m => {
          let score = 0;
          if (m.reachesGhar) score += 10000;
          if (m.isCapture) {
            score += 2000;
            if (!this.hasCaptured[curPlayer]) score += 3000;
          }
          if (this.isCellSafe(m.toCoord)) score += 400;
          score += (m.toStep - m.fromStep) * 30;
          if (m.toStep >= 16) score += 500;

          if (score > bestScore) {
            bestScore = score;
            chosenMove = m;
          }
        });
      }

      this.executeMove(curPlayer, chosenMove);
    }

    passTurn() {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.activePlayerIndices.length;
      this.currentRoll = 0;
      this.legalMoves = [];
      this.updateHUD();

      const nextPlayer = this.activePlayerIndices[this.currentTurnIndex];
      if (this.isAITurn()) {
        this.enableRollButton(false);
        this.setMessage(`AI is taking its turn...`);
        setTimeout(() => this.triggerRoll(), 1000);
      } else {
        this.enableRollButton(true);
        this.setMessage(`${PLAYER_CONFIG[nextPlayer].nameShort}'s turn: Cast cowries!`);
      }
    }

    isAITurn() {
      if (this.gameMode !== 'ai') return false;
      const curPlayer = this.activePlayerIndices[this.currentTurnIndex];
      return curPlayer !== 0; // Player 0 is Human
    }

    enableRollButton(enable) {
      const rollBtn = document.getElementById('roll-dice-btn');
      if (rollBtn) rollBtn.disabled = !enable;
    }

    updateHUD() {
      const curPlayerId = this.activePlayerIndices[this.currentTurnIndex];
      const pConf = PLAYER_CONFIG[curPlayerId];

      const dot = document.getElementById('current-player-color-dot');
      const name = document.getElementById('current-player-name');
      const modeDisplay = document.getElementById('game-mode-display');

      if (dot) {
        dot.style.background = pConf.hex;
        dot.style.boxShadow = `0 0 10px ${pConf.hex}`;
      }
      if (name) name.textContent = pConf.name;
      if (modeDisplay) {
        modeDisplay.textContent = this.gameMode === 'ai' 
          ? `vs AI (${this.aiDifficulty.toUpperCase()})` 
          : `Local Multiplayer (${this.numPlayers}P)`;
      }
    }

    setMessage(text) {
      const banner = document.getElementById('hud-message-banner');
      if (banner) banner.textContent = text;
    }

    showVictoryModal(playerId) {
      const modal = document.getElementById('game-victory-modal');
      const title = document.getElementById('victory-player-title');
      if (title) title.textContent = `${PLAYER_CONFIG[playerId].name} Wins!`;
      if (modal) modal.style.display = 'flex';
    }

    onWindowResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    updateCameraPos() {
      this.camYaw += (this.targetYaw - this.camYaw) * 0.1;
      this.camPitch += (this.targetPitch - this.camPitch) * 0.1;
      this.camDistance += (this.targetDistance - this.camDistance) * 0.1;

      const x = this.camDistance * Math.sin(this.camYaw) * Math.cos(this.camPitch);
      const y = this.camDistance * Math.sin(this.camPitch);
      const z = this.camDistance * Math.cos(this.camYaw) * Math.cos(this.camPitch);

      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.camTarget);
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      this.updateCameraPos();
      if (this.dustParticles) {
        this.dustParticles.rotation.y += 0.0005;
      }
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ChowkaBaraApp());
  } else {
    new ChowkaBaraApp();
  }
})();
