/**
 * ==============================================================================
 * Mantrika Games — Nine Men's Morris 3D (Navakankari) Engine
 * ==============================================================================
 */
(function() {
  'use strict';

  // 24 Node coordinates on 3 concentric squares (scaled to 3D world units)
  const NODE_COORDS = [
    // Outer square (0 to 7)
    {x:-6, z:-6}, {x:0, z:-6}, {x:6, z:-6}, {x:6, z:0}, {x:6, z:6}, {x:0, z:6}, {x:-6, z:6}, {x:-6, z:0},
    // Middle square (8 to 15)
    {x:-4, z:-4}, {x:0, z:-4}, {x:4, z:-4}, {x:4, z:0}, {x:4, z:4}, {x:0, z:4}, {x:-4, z:4}, {x:-4, z:0},
    // Inner square (16 to 23)
    {x:-2, z:-2}, {x:0, z:-2}, {x:2, z:-2}, {x:2, z:0}, {x:2, z:2}, {x:0, z:2}, {x:-2, z:2}, {x:-2, z:0}
  ];

  const ADJACENCY = {
    0:[1,7], 1:[0,2,9], 2:[1,3], 3:[2,4,11], 4:[3,5], 5:[4,6,13], 6:[5,7], 7:[6,0,15],
    8:[9,15], 9:[8,10,1,17], 10:[9,11], 11:[10,12,3,19], 12:[11,13], 13:[12,14,5,21], 14:[13,15], 15:[14,8,7,23],
    16:[17,23], 17:[16,18,9], 18:[17,19], 19:[18,20,11], 20:[19,21], 21:[20,22,13], 22:[21,23], 23:[22,16,15]
  };

  const MILLS = [
    [0,1,2],[2,3,4],[4,5,6],[6,7,0],
    [8,9,10],[10,11,12],[12,13,14],[14,15,8],
    [16,17,18],[18,19,20],[20,21,22],[22,23,16],
    [1,9,17],[3,11,19],[5,13,21],[7,15,23]
  ];

  class MorrisApp {
    constructor() {
      this.container = document.getElementById('game-viewport-container');
      this.canvas = document.getElementById('morris-canvas');
      if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

      this.gameMode = 'ai';
      this.board = Array(24).fill(-1); // -1 empty, 0 White (South/Human), 1 Black (North/AI)
      this.unplaced = { 0: 9, 1: 9 };
      this.turn = 0;
      this.mustRemoveOpponent = false;
      this.selectedNode = null;
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
      this.camera.position.set(0, 18, 13);
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
      
      // Procedural Polished Marble Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 360);
      grad.addColorStop(0, '#383431');
      grad.addColorStop(1, '#1F1C1A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Subtle marble veins
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, 0);
        ctx.bezierCurveTo(Math.random() * 512, 170, Math.random() * 512, 340, Math.random() * 512, 512);
        ctx.stroke();
      }
      const marbleTex = new THREE.CanvasTexture(canvas);

      const stoneMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.35, metalness: 0.15 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 15), stoneMat);
      slab.position.y = -0.2;
      slab.receiveShadow = true;
      this.boardGroup.add(slab);

      // Engraved Brass Lines
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });

      // Outer square
      this.addSquareLines(12, lineMat);
      // Middle square
      this.addSquareLines(8, lineMat);
      // Inner square
      this.addSquareLines(4, lineMat);

      // 4 Cross connecting lines
      this.addConnectLine({x:0, z:-6}, {x:0, z:-2}, lineMat);
      this.addConnectLine({x:0, z:6}, {x:0, z:2}, lineMat);
      this.addConnectLine({x:-6, z:0}, {x:-2, z:0}, lineMat);
      this.addConnectLine({x:6, z:0}, {x:2, z:0}, lineMat);

      // 24 Node Points (Indents)
      const dotMat = new THREE.MeshStandardMaterial({ color: 0xC89B3C, metalness: 0.9, roughness: 0.2 });
      NODE_COORDS.forEach((c, idx) => {
        const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 16), dotMat);
        dot.position.set(c.x, 0.015, c.z);
        dot.userData = { nodeIdx: idx };
        this.boardGroup.add(dot);
      });

      this.scene.add(this.boardGroup);
    }

    addSquareLines(size, mat) {
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(size, 0.02, 0.04), mat); h1.position.set(0, 0.01, -size/2);
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(size, 0.02, 0.04), mat); h2.position.set(0, 0.01, size/2);
      const v1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, size), mat); v1.position.set(-size/2, 0.01, 0);
      const v2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, size), mat); v2.position.set(size/2, 0.01, 0);
      this.boardGroup.add(h1, h2, v1, v2);
    }

    addConnectLine(p1, p2, mat) {
      const len = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, len), mat);
      line.position.set((p1.x + p2.x)/2, 0.01, (p1.z + p2.z)/2);
      if (Math.abs(p2.x - p1.x) > 0.01) line.rotation.y = Math.PI/2;
      this.boardGroup.add(line);
    }

    buildPiecesGroup() {
      this.piecesGroup = new THREE.Group();
      this.scene.add(this.piecesGroup);
    }

    updatePieces3D() {
      while (this.piecesGroup.children.length > 0) this.piecesGroup.remove(this.piecesGroup.children[0]);

      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F0, roughness: 0.2, metalness: 0.1 });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x1A1817, roughness: 0.3, metalness: 0.2 });

      this.board.forEach((val, idx) => {
        if (val === -1) return;
        const mat = val === 0 ? whiteMat : blackMat;
        const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.25, 20), mat);
        stone.position.set(NODE_COORDS[idx].x, 0.14, NODE_COORDS[idx].z);
        stone.userData = { nodeIdx: idx, player: val };
        this.piecesGroup.add(stone);
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
      // If player must remove an opponent piece due to a Mill
      if (this.mustRemoveOpponent) {
        if (this.board[nodeIdx] === 1) { // Opponent is Black (1)
          this.board[nodeIdx] = -1;
          this.mustRemoveOpponent = false;
          this.updatePieces3D();
          this.passTurn();
        }
        return;
      }

      // Phase 1: Placing Stones
      if (this.unplaced[0] > 0) {
        if (this.board[nodeIdx] === -1) {
          this.board[nodeIdx] = 0;
          this.unplaced[0]--;
          this.updatePieces3D();
          if (this.checkMillFormed(nodeIdx, 0)) {
            this.mustRemoveOpponent = true;
            this.setMessage('Mill formed! Click an opponent stone to remove it.');
          } else {
            this.passTurn();
          }
        }
        return;
      }

      // Phase 2 / 3: Moving / Flying
      if (this.selectedNode === null) {
        if (this.board[nodeIdx] === 0) {
          this.selectedNode = nodeIdx;
          this.setMessage(`Stone selected at node ${nodeIdx}. Click a connected empty node.`);
        }
      } else {
        if (this.board[nodeIdx] === -1) {
          const countOnBoard = this.board.filter(v => v === 0).length;
          const isFlying = (countOnBoard === 3);
          if (isFlying || ADJACENCY[this.selectedNode].includes(nodeIdx)) {
            this.board[this.selectedNode] = -1;
            this.board[nodeIdx] = 0;
            const from = this.selectedNode;
            this.selectedNode = null;
            this.updatePieces3D();
            if (this.checkMillFormed(nodeIdx, 0)) {
              this.mustRemoveOpponent = true;
              this.setMessage('Mill formed! Click an opponent stone to remove it.');
            } else {
              this.passTurn();
            }
            return;
          }
        }
        this.selectedNode = null;
      }
    }

    checkMillFormed(nodeIdx, player) {
      return MILLS.some(mill => mill.includes(nodeIdx) && mill.every(n => this.board[n] === player));
    }

    passTurn() {
      this.checkWin();
      if (this.winner !== -1) return;

      this.turn = this.turn === 0 ? 1 : 0;
      this.updateHUD();

      if (this.turn === 1 && this.gameMode === 'ai') {
        this.setMessage('AI is calculating strategic placement...');
        setTimeout(() => this.executeAI(), 700);
      } else {
        if (this.unplaced[0] > 0) {
          this.setMessage(`Your turn: Place stone #${10 - this.unplaced[0]} of 9.`);
        } else {
          this.setMessage(`Your turn: Slide a stone to form a Mill.`);
        }
      }
    }

    executeAI() {
      // AI Phase 1: Placement Phase
      if (this.unplaced[1] > 0) {
        const freeNodes = [];
        this.board.forEach((v, idx) => { if (v === -1) freeNodes.push(idx); });
        if (freeNodes.length === 0) return;

        let chosenNode = freeNodes[0];

        if (this.aiDifficulty === 'easy') {
          chosenNode = freeNodes[Math.floor(Math.random() * freeNodes.length)];
        } else {
          let bestScore = -999999;
          freeNodes.forEach(node => {
            let score = 0;
            // 1. Can AI complete a Mill?
            this.board[node] = 1;
            if (this.checkMillFormed(node, 1)) score += 10000;
            this.board[node] = -1;

            // 2. Can Human complete a Mill on next turn? Block it!
            this.board[node] = 0;
            if (this.checkMillFormed(node, 0)) score += 5000;
            this.board[node] = -1;

            if (this.aiDifficulty === 'hard') {
              // 3. Strategic junction control (nodes 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23)
              if ([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23].includes(node)) score += 400;
              // 4. Corner nodes
              if ([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].includes(node)) score += 200;
            }

            if (score > bestScore) {
              bestScore = score;
              chosenNode = node;
            }
          });
        }

        this.board[chosenNode] = 1;
        this.unplaced[1]--;
        this.updatePieces3D();

        if (this.checkMillFormed(chosenNode, 1)) {
          this.executeAIRemoveHumanStone();
        }
        this.passTurn();
        return;
      }

      // AI Phase 2: Movement Phase
      const aiNodes = [];
      this.board.forEach((v, idx) => { if (v === 1) aiNodes.push(idx); });
      const possibleMoves = [];

      aiNodes.forEach(from => {
        const adjs = ADJACENCY[from].filter(n => this.board[n] === -1);
        adjs.forEach(to => {
          possibleMoves.push({ from, to });
        });
      });

      if (possibleMoves.length === 0) {
        this.passTurn();
        return;
      }

      let chosenMove = possibleMoves[0];

      if (this.aiDifficulty === 'easy') {
        chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else {
        let bestScore = -999999;
        possibleMoves.forEach(m => {
          let score = 0;
          this.board[m.from] = -1;
          this.board[m.to] = 1;

          if (this.checkMillFormed(m.to, 1)) score += 10000;

          // Block human mill threat
          this.board[m.to] = 0;
          if (this.checkMillFormed(m.to, 0)) score += 4000;
          this.board[m.to] = 1;

          if (this.aiDifficulty === 'hard') {
            score += ADJACENCY[m.to].filter(n => this.board[n] === -1).length * 50;
          }

          this.board[m.from] = 1;
          this.board[m.to] = -1;

          if (score > bestScore) {
            bestScore = score;
            chosenMove = m;
          }
        });
      }

      this.board[chosenMove.from] = -1;
      this.board[chosenMove.to] = 1;
      this.updatePieces3D();

      if (this.checkMillFormed(chosenMove.to, 1)) {
        this.executeAIRemoveHumanStone();
      }
      this.passTurn();
    }

    executeAIRemoveHumanStone() {
      const humanStones = [];
      this.board.forEach((v, idx) => { if (v === 0) humanStones.push(idx); });
      if (humanStones.length === 0) return;

      let chosen = humanStones[0];
      // Target non-mill stones first
      const nonMillStones = humanStones.filter(s => !this.checkMillFormed(s, 0));
      if (nonMillStones.length > 0) {
        chosen = nonMillStones[0];
      }
      this.board[chosen] = -1;
      this.updatePieces3D();
      this.setMessage('AI formed a Mill and captured one of your stones!');
    }

    initDOMControls() {
      const startBtn = document.getElementById('start-game-btn');
      const setupModal = document.getElementById('game-setup-modal');
      const modeBtns = document.querySelectorAll('.mode-btn');
      const diffBtns = document.querySelectorAll('.diff-btn');

      modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          modeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.gameMode = btn.getAttribute('data-mode');
        });
      });

      diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          diffBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.aiDifficulty = btn.getAttribute('data-diff') || 'medium';
        });
      });

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (setupModal) setupModal.style.display = 'none';
          this.startNewGame();
        });
      }
    }

    startNewGame() {
      this.board = Array(24).fill(-1);
      this.unplaced = { 0: 9, 1: 9 };
      this.turn = 0;
      this.mustRemoveOpponent = false;
      this.selectedNode = null;
      this.winner = -1;
      this.updatePieces3D();
      this.updateHUD();
      this.setMessage('Nine Men\'s Morris started! Place stone #1 of 9.');
    }

    updateHUD() {
      const dot = document.getElementById('current-player-color-dot');
      const name = document.getElementById('current-player-name');
      if (dot) dot.style.background = this.turn === 0 ? '#F5F5F0' : '#1A1817';
      if (name) name.textContent = this.turn === 0 ? `White (To Place: ${this.unplaced[0]})` : `Black (To Place: ${this.unplaced[1]})`;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new MorrisApp());
  else new MorrisApp();
})();
