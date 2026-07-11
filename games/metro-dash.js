/* ==================================================================
   NEXUS ARCADE — Cartridge: Metro Dash 3D
   Registers itself on window.NexusGames.metroDash
   A 3D lane-runner: dodge trains, jump/duck barriers, collect coins,
   grab power-ups (jump shoes / magnet / hoverboard), outrun police,
   and pass through Continue Gates for a revive token.
   Built with three.js (loaded on demand from CDN).
   ================================================================== */
(() => {
  'use strict';

  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let threeLoadPromise = null;

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeLoadPromise) return threeLoadPromise;
    threeLoadPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = THREE_SRC;
      s.onload = () => resolve(window.THREE);
      s.onerror = () => reject(new Error('3D engine failed to load'));
      document.head.appendChild(s);
    });
    return threeLoadPromise;
  }

  // ---------------- tunables ----------------
  const LANES = [-2.2, 0, 2.2];
  const GRAVITY = -26;
  const BASE_JUMP_V = 9.6;
  const JUMP_BOOST_MULT = 1.45;
  const DUCK_TIME = 0.7;
  const LANE_LERP = 12;
  const BASE_SPEED = 9;
  const MAX_SPEED = 23;
  const SPEED_RAMP = 0.018;
  const PATTERN_SPACING = 13;
  const SPAWN_Z = -70;
  const DESPAWN_Z = 4;
  const JUMP_BOOST_DURATION = 8;
  const MAGNET_DURATION = 7;
  const HOVER_DURATION = 9;
  const HOVER_MAX_STOCK = 3;
  const CONTINUE_MAX = 3;
  const DOUBLE_TAP_MS = 320;

  function createGame(container, THREE) {
    // ---------- DOM shell ----------
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;' +
      'font-family:Orbitron,sans-serif;padding-top:48px;box-sizing:border-box;width:100%;';
    wrap.innerHTML = `
      <div style="width:100%;max-width:420px;display:flex;justify-content:space-between;padding:0 10px;font-size:12px;color:#fff;letter-spacing:.05em;">
        <span style="color:#00f6ff;text-shadow:0 0 8px rgba(0,246,255,.6);">SCORE: <b data-role="score">0</b></span>
        <span style="color:#ffd400;text-shadow:0 0 8px rgba(255,212,0,.6);">COINS: <b data-role="coins">0</b></span>
        <span style="color:#ff2ee6;text-shadow:0 0 8px rgba(255,46,230,.6);">BEST: <b data-role="best">0</b></span>
      </div>
      <div data-role="holder" style="position:relative;width:100%;max-width:420px;border-radius:12px;overflow:hidden;box-shadow:0 0 25px rgba(0,246,255,.25);background:#050611;">
        <div data-role="buffs" style="position:absolute;top:6px;left:6px;right:6px;display:flex;gap:6px;flex-wrap:wrap;pointer-events:none;z-index:5;"></div>
        <div data-role="overlay" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(5,6,17,0.72);color:#fff;text-align:center;z-index:10;font-family:Orbitron,sans-serif;padding:16px;box-sizing:border-box;">
          <div style="font-size:20px;color:#00f6ff;text-shadow:0 0 10px rgba(0,246,255,.7);">METRO DASH 3D</div>
          <div style="font-size:12px;color:#c8cfe6;line-height:1.6;">SWIPE / ARROWS — CHANGE LANE<br>SWIPE UP / SPACE — JUMP<br>SWIPE DOWN — DUCK<br>DOUBLE-TAP / H — HOVERBOARD</div>
          <div data-role="start-btn" style="margin-top:6px;padding:10px 26px;background:#00f6ff;color:#04050c;font-weight:bold;border-radius:24px;cursor:pointer;box-shadow:0 0 15px rgba(0,246,255,.5);">TAP TO START</div>
        </div>
      </div>
      <div style="font-size:11px;color:#8b93ac;text-align:center;">SWIPE/ARROWS: MOVE • UP: JUMP • DOWN: DUCK • DOUBLE-TAP/H: BOARD</div>
    `;
    container.appendChild(wrap);

    const holder = wrap.querySelector('[data-role="holder"]');
    const overlay = wrap.querySelector('[data-role="overlay"]');
    const startBtn = wrap.querySelector('[data-role="start-btn"]');
    const buffsEl = wrap.querySelector('[data-role="buffs"]');
    const scoreEl = wrap.querySelector('[data-role="score"]');
    const coinsEl = wrap.querySelector('[data-role="coins"]');
    const bestEl = wrap.querySelector('[data-role="best"]');

    let best = Number(localStorage.getItem('nexus_metro_best') || 0);
    bestEl.textContent = best;

    function setHolderSize() {
      const w = holder.clientWidth || 320;
      holder.style.height = Math.round(w * (4 / 3)) + 'px';
    }
    setHolderSize();

    // ---------- three.js scene ----------
    const scene = new THREE.Scene();

    function createSkyTexture() {
      const c = document.createElement('canvas');
      c.width = 2; c.height = 256;
      const cx = c.getContext('2d');
      const grad = cx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#1b1140');
      grad.addColorStop(0.42, '#3a2166');
      grad.addColorStop(0.72, '#8a3f72');
      grad.addColorStop(1, '#ffa571');
      cx.fillStyle = grad;
      cx.fillRect(0, 0, 2, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    scene.background = createSkyTexture();
    scene.fog = new THREE.Fog(0x4a2d6b, 22, 70);

    const camera = new THREE.PerspectiveCamera(62, holder.clientWidth / holder.clientHeight, 0.1, 200);
    camera.position.set(0, 4.6, 8);
    camera.lookAt(0, 1.6, -6);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      const msg = document.createElement('div');
      msg.style.cssText = 'color:#fff;padding:30px;text-align:center;font-family:Orbitron,sans-serif;';
      msg.textContent = '3D not supported on this browser/device.';
      wrap.appendChild(msg);
      return { destroy() { wrap.remove(); } };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(holder.clientWidth, holder.clientHeight);
    holder.insertBefore(renderer.domElement, holder.firstChild);

    scene.add(new THREE.HemisphereLight(0xffd9a0, 0x241a3d, 0.65));
    scene.add(new THREE.AmbientLight(0x9aa0ff, 0.4));
    const sun = new THREE.DirectionalLight(0xfff2df, 0.95);
    sun.position.set(-6, 14, 6);
    scene.add(sun);

    // ---------- distant sea (scenic backdrop beyond the trees) ----------
    const seaMat = new THREE.MeshLambertMaterial({ color: 0x0f6b7a, emissive: 0x03242b, transparent: true, opacity: 0.88 });
    const seaGeo = new THREE.PlaneGeometry(40, 240);
    [-1, 1].forEach((side) => {
      const sea = new THREE.Mesh(seaGeo, seaMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(side * 30, -0.18, -70);
      scene.add(sea);
    });

    // ---------- ground / track ----------
    const SEG_LEN = 16;
    const NUM_SEG = 7;
    const laneMat = new THREE.MeshLambertMaterial({ color: 0x1c1533 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x54e6ff });
    const segments = [];
    for (let i = 0; i < NUM_SEG; i++) {
      const seg = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, SEG_LEN), laneMat);
      base.position.y = -0.2;
      seg.add(base);
      [-1.1, 1.1].forEach((lx) => {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, SEG_LEN * 0.9), lineMat);
        line.position.set(lx, 0.01, 0);
        seg.add(line);
      });
      seg.position.z = -i * SEG_LEN;
      scene.add(seg);
      segments.push(seg);
    }

    // ---------- trees (fuller, colorful clustered canopies) ----------
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
    const leafMats = [
      new THREE.MeshLambertMaterial({ color: 0x2fbf6e, emissive: 0x062011 }),
      new THREE.MeshLambertMaterial({ color: 0x3fd17e, emissive: 0x062011 }),
      new THREE.MeshLambertMaterial({ color: 0x1f9a55, emissive: 0x041a0d }),
    ];
    const blossomMat = new THREE.MeshLambertMaterial({ color: 0xff8fc7, emissive: 0x330018 });
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.5, 6);
    const leafGeoA = new THREE.SphereGeometry(0.72, 8, 7);
    const leafGeoB = new THREE.SphereGeometry(0.52, 8, 7);
    const leafGeoC = new THREE.SphereGeometry(0.46, 8, 7);
    const trees = [];
    function placeTree(t) {
      const side = Math.random() > 0.5 ? 1 : -1;
      t.position.set(side * (5 + Math.random() * 2.5), 0, t.position.z);
    }
    function buildTree() {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.75;
      t.add(trunk);
      const mat = Math.random() < 0.18 ? blossomMat : leafMats[Math.floor(Math.random() * leafMats.length)];
      const c1 = new THREE.Mesh(leafGeoA, mat); c1.position.set(0, 2.05, 0); t.add(c1);
      const c2 = new THREE.Mesh(leafGeoB, mat); c2.position.set(0.34, 2.3, 0.16); t.add(c2);
      const c3 = new THREE.Mesh(leafGeoC, mat); c3.position.set(-0.3, 2.32, -0.2); t.add(c3);
      t.position.z = -Math.random() * 100;
      placeTree(t);
      scene.add(t);
      trees.push(t);
    }
    for (let i = 0; i < 26; i++) buildTree();

    // ---------- humanoid builder (shared by player & police) ----------
    const humanGeo = {
      torso: new THREE.BoxGeometry(0.6, 0.68, 0.38),
      head: new THREE.SphereGeometry(0.26, 14, 12),
      leg: new THREE.CylinderGeometry(0.115, 0.135, 0.66, 8),
      arm: new THREE.CylinderGeometry(0.09, 0.105, 0.56, 8),
      hand: new THREE.SphereGeometry(0.09, 8, 8),
      shoe: new THREE.BoxGeometry(0.24, 0.14, 0.34),
      cap: new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      brim: new THREE.CylinderGeometry(0.29, 0.29, 0.04, 14),
      badge: new THREE.BoxGeometry(0.08, 0.08, 0.02),
    };

    function buildHuman(opts) {
      const group = new THREE.Group();
      const skinMat = new THREE.MeshLambertMaterial({ color: opts.skin });
      const topMat = new THREE.MeshLambertMaterial({ color: opts.top, emissive: opts.topEmissive || 0x000000 });
      const bottomMat = new THREE.MeshLambertMaterial({ color: opts.bottom });
      const shoeMat = new THREE.MeshLambertMaterial({ color: 0x0e0e14 });

      const torso = new THREE.Mesh(humanGeo.torso, topMat);
      torso.position.y = 1.15;
      group.add(torso);

      const head = new THREE.Mesh(humanGeo.head, skinMat);
      head.position.y = 1.72;
      group.add(head);

      if (opts.cap) {
        const capMat = new THREE.MeshLambertMaterial({ color: opts.capColor });
        const cap = new THREE.Mesh(humanGeo.cap, capMat);
        cap.position.y = 1.9;
        group.add(cap);
        const brim = new THREE.Mesh(humanGeo.brim, capMat);
        brim.position.set(0, 1.83, 0.2);
        group.add(brim);
      }

      const legL = new THREE.Mesh(humanGeo.leg, bottomMat);
      legL.position.set(-0.16, 0.5, 0);
      const legR = legL.clone();
      legR.position.x = 0.16;
      group.add(legL, legR);

      const shoeL = new THREE.Mesh(humanGeo.shoe, shoeMat);
      shoeL.position.set(-0.16, 0.16, 0.04);
      const shoeR = shoeL.clone();
      shoeR.position.x = 0.16;
      group.add(shoeL, shoeR);

      const armL = new THREE.Mesh(humanGeo.arm, topMat);
      armL.position.set(-0.4, 1.15, 0);
      const armR = armL.clone();
      armR.position.x = 0.4;
      group.add(armL, armR);

      const handL = new THREE.Mesh(humanGeo.hand, skinMat);
      handL.position.set(-0.4, 0.84, 0);
      const handR = handL.clone();
      handR.position.x = 0.4;
      group.add(handL, handR);

      if (opts.badge) {
        const badge = new THREE.Mesh(humanGeo.badge, new THREE.MeshLambertMaterial({ color: 0xffd400, emissive: 0x332900 }));
        badge.position.set(0.17, 1.27, 0.2);
        group.add(badge);
      }

      return { group, torso, head, legL, legR, armL, armR, topMat };
    }

    // ---------- player ----------
    const playerHuman = buildHuman({
      skin: 0xffc38b,
      top: 0xff2e6b,
      topEmissive: 0x330011,
      bottom: 0x1e2a52,
    });
    const player = playerHuman.group;
    const { legL, legR, armL, armR } = playerHuman;
    const hoodieMat = playerHuman.topMat;

    const boardMat = new THREE.MeshLambertMaterial({ color: 0x00f6ff, emissive: 0x004a55 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.3), boardMat);
    board.position.y = 0.1;
    board.visible = false;
    player.add(board);

    player.position.set(0, 0, 0);
    scene.add(player);

    // ---------- police officer (chaser) ----------
    const policeHuman = buildHuman({
      skin: 0xe3a97a,
      top: 0x1c2b52,
      topEmissive: 0x05070f,
      bottom: 0x11162a,
      cap: true,
      capColor: 0x0d1224,
      badge: true,
    });
    const police = policeHuman.group;
    const policeLegL = policeHuman.legL;
    const policeLegR = policeHuman.legR;
    const policeArmL = policeHuman.armL;
    const policeArmR = policeHuman.armR;
    police.position.set(0, 0, 4.2);
    scene.add(police);

    // ---------- entity pools (obstacles / coins / powerups / gates) ----------
    const obstacleMats = {
      train: new THREE.MeshLambertMaterial({ color: 0x2f3550, emissive: 0x0a0d1a }),
      low: new THREE.MeshLambertMaterial({ color: 0xff9a2e }),
      high: new THREE.MeshLambertMaterial({ color: 0xd63bff }),
    };
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xffd400, emissive: 0x4a3900 });
    const puMats = {
      jump: new THREE.MeshLambertMaterial({ color: 0xff9a2e, emissive: 0x442200 }),
      magnet: new THREE.MeshLambertMaterial({ color: 0xb26bff, emissive: 0x220044 }),
      hover: new THREE.MeshLambertMaterial({ color: 0x00f6ff, emissive: 0x003a44 }),
    };
    const gateMat = new THREE.MeshLambertMaterial({ color: 0xffe27a, emissive: 0x554400 });

    // Shared geometries: create each shape ONCE and reuse it for every
    // spawn instead of allocating a fresh geometry per obstacle/coin.
    // This is what removes the periodic garbage-collector hitch that
    // showed up as a stutter after a few hundred meters.
    const geo = {
      train: new THREE.BoxGeometry(1.7, 2.4, 2.2),
      low: new THREE.BoxGeometry(1.6, 0.55, 0.4),
      high: new THREE.BoxGeometry(1.6, 0.35, 0.4),
      coin: new THREE.TorusGeometry(0.22, 0.08, 8, 16),
      jump: new THREE.BoxGeometry(0.5, 0.3, 0.7),
      magnet: new THREE.SphereGeometry(0.32, 10, 10),
      hover: new THREE.BoxGeometry(0.7, 0.1, 1.2),
      gatePost: new THREE.BoxGeometry(0.3, 3, 0.3),
      gateTop: new THREE.BoxGeometry(6.2, 0.3, 0.3),
    };

    let entities = []; // {mesh, type, lane, z, kind}

    function makeTrain(lane) {
      const m = new THREE.Mesh(geo.train, obstacleMats.train);
      m.position.set(LANES[lane], 1.2, 0);
      return m;
    }
    function makeLowBarrier(lane) {
      const m = new THREE.Mesh(geo.low, obstacleMats.low);
      m.position.set(LANES[lane], 0.28, 0);
      return m;
    }
    function makeHighBarrier(lane) {
      const m = new THREE.Mesh(geo.high, obstacleMats.high);
      m.position.set(LANES[lane], 1.55, 0);
      return m;
    }
    function makeCoin(lane, yOff) {
      const m = new THREE.Mesh(geo.coin, coinMat);
      m.position.set(LANES[lane], 1.0 + (yOff || 0), 0);
      return m;
    }
    function makePowerup(kind, lane) {
      const g = kind === 'jump' ? geo.jump : kind === 'magnet' ? geo.magnet : geo.hover;
      const m = new THREE.Mesh(g, puMats[kind]);
      m.position.set(LANES[lane], 1.0, 0);
      return m;
    }
    function makeGate() {
      const g = new THREE.Group();
      [-2.8, 2.8].forEach((x) => {
        const post = new THREE.Mesh(geo.gatePost, gateMat);
        post.position.set(x, 1.5, 0);
        g.add(post);
      });
      const top = new THREE.Mesh(geo.gateTop, gateMat);
      top.position.set(0, 3, 0);
      g.add(top);
      return g;
    }

    function addEntity(kind, type, lane, z, extra) {
      let mesh;
      if (kind === 'obstacle') {
        mesh = type === 'train' ? makeTrain(lane) : type === 'low' ? makeLowBarrier(lane) : makeHighBarrier(lane);
      } else if (kind === 'coin') {
        mesh = makeCoin(lane, extra);
      } else if (kind === 'powerup') {
        mesh = makePowerup(type, lane);
      } else if (kind === 'gate') {
        mesh = makeGate();
      }
      mesh.position.z = z;
      scene.add(mesh);
      entities.push({ mesh, kind, type, lane, z, collected: false });
    }

    function spawnCoinRow(baseZ, lane, count) {
      for (let i = 0; i < count; i++) addEntity('coin', 'coin', lane, baseZ - i * 1.1);
    }
    function spawnCoinArc(baseZ, lane) {
      for (let i = 0; i < 5; i++) {
        const yOff = Math.sin((i / 4) * Math.PI) * 1.4;
        addEntity('coin', 'coin', lane, baseZ - i * 1.1, yOff);
      }
    }

    function spawnPattern(baseZ) {
      const roll = Math.random();
      if (roll < 0.28) {
        const lane = Math.floor(Math.random() * 3);
        addEntity('obstacle', 'train', lane, baseZ);
        const openLanes = [0, 1, 2].filter((l) => l !== lane);
        const rewardLane = openLanes[Math.floor(Math.random() * openLanes.length)];
        if (Math.random() < 0.6) spawnCoinRow(baseZ, rewardLane, 3);
      } else if (roll < 0.5) {
        const lane = Math.floor(Math.random() * 3);
        addEntity('obstacle', 'low', lane, baseZ);
        if (Math.random() < 0.5) spawnCoinArc(baseZ - 0.5, lane);
      } else if (roll < 0.72) {
        const lane = Math.floor(Math.random() * 3);
        addEntity('obstacle', 'high', lane, baseZ);
      } else if (roll < 0.92) {
        const lane = Math.floor(Math.random() * 3);
        spawnCoinRow(baseZ, lane, 4 + Math.floor(Math.random() * 3));
      } else {
        const kinds = ['jump', 'magnet', 'hover'];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        const lane = Math.floor(Math.random() * 3);
        addEntity('powerup', kind, lane, baseZ);
      }
    }

    let distSinceGate = 0;
    const GATE_SPACING = 480;

    // ---------- game state ----------
    let state = 'ready'; // ready | running | reviving | gameover
    let speed = BASE_SPEED;
    let distance = 0;
    let coins = 0;
    let laneIndex = 1;
    let playerX = LANES[1];
    let playerY = 0;
    let jumpVy = 0;
    let jumping = false;
    let ducking = false;
    let duckTimer = 0;
    let nextSpawnAt = 20;

    let jumpBoostT = 0;
    let magnetT = 0;
    let hoverT = 0;
    let hoverStock = 0;
    let continueTokens = 0;
    let invulnT = 0;

    let walkClock = 0;

    function resetRunState() {
      speed = BASE_SPEED;
      distance = 0;
      coins = 0;
      laneIndex = 1;
      playerX = LANES[1];
      playerY = 0; jumpVy = 0; jumping = false;
      ducking = false; duckTimer = 0;
      jumpBoostT = 0; magnetT = 0; hoverT = 0; hoverStock = 0;
      continueTokens = 0; invulnT = 0;
      nextSpawnAt = 20;
      distSinceGate = 0;
      entities.forEach((e) => scene.remove(e.mesh));
      entities = [];
      scoreEl.textContent = '0';
      coinsEl.textContent = '0';
      updateBuffsUI();
    }

    function updateBuffsUI() {
      const chips = [];
      if (jumpBoostT > 0) chips.push(`<span style="background:rgba(255,154,46,.85);color:#1a0d00;padding:2px 8px;border-radius:10px;font-size:10px;">JUMP+ ${jumpBoostT.toFixed(0)}s</span>`);
      if (magnetT > 0) chips.push(`<span style="background:rgba(178,107,255,.85);color:#1a0022;padding:2px 8px;border-radius:10px;font-size:10px;">MAGNET ${magnetT.toFixed(0)}s</span>`);
      if (hoverT > 0) chips.push(`<span style="background:rgba(0,246,255,.85);color:#00232a;padding:2px 8px;border-radius:10px;font-size:10px;">BOARD ${hoverT.toFixed(0)}s</span>`);
      if (hoverStock > 0) chips.push(`<span style="background:rgba(255,255,255,.15);color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;">BOARD x${hoverStock}</span>`);
      buffsEl.innerHTML = chips.join('');
    }

    function startRun() {
      resetRunState();
      overlay.style.display = 'none';
      state = 'running';
    }

    function crash() {
      if (invulnT > 0 || hoverT > 0) return;
      state = 'reviving';
      const startPZ = police.position.z;
      const startTime = performance.now();
      function lungeStep() {
        const t = Math.min(1, (performance.now() - startTime) / 550);
        police.position.z = startPZ - t * (startPZ - 0.6);
        if (t < 1) requestAnimationFrame(lungeStep);
        else showGameOver();
      }
      lungeStep();
    }

    function showGameOver() {
      state = 'gameover';
      const finalScore = Math.floor(distance) + coins * 5;
      if (finalScore > best) {
        best = finalScore;
        localStorage.setItem('nexus_metro_best', String(best));
        bestEl.textContent = best;
      }
      overlay.innerHTML = `
        <div style="font-size:20px;color:#ff2e6b;text-shadow:0 0 10px rgba(255,46,107,.7);">CAUGHT!</div>
        <div style="font-size:13px;color:#fff;">SCORE: ${finalScore} &nbsp;|&nbsp; COINS: ${coins}</div>
        ${continueTokens > 0 ? `<div data-role="continue-btn" style="margin-top:6px;padding:10px 22px;background:#ffe27a;color:#332600;font-weight:bold;border-radius:24px;cursor:pointer;">CONTINUE (${continueTokens} left)</div>` : ''}
        <div data-role="restart-btn" style="margin-top:6px;padding:10px 26px;background:#00f6ff;color:#04050c;font-weight:bold;border-radius:24px;cursor:pointer;box-shadow:0 0 15px rgba(0,246,255,.5);">RESTART</div>
      `;
      overlay.style.display = 'flex';
      const restartBtn = overlay.querySelector('[data-role="restart-btn"]');
      restartBtn.addEventListener('click', startRun);
      restartBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRun(); }, { passive: false });
      const contBtn = overlay.querySelector('[data-role="continue-btn"]');
      if (contBtn) {
        const doContinue = () => {
          continueTokens--;
          entities.filter((e) => e.z > -6 && e.z < 8).forEach((e) => { scene.remove(e.mesh); e.collected = true; });
          entities = entities.filter((e) => !e.collected);
          police.position.z = 4.2;
          invulnT = 2.2;
          overlay.style.display = 'none';
          state = 'running';
        };
        contBtn.addEventListener('click', doContinue);
        contBtn.addEventListener('touchstart', (e) => { e.preventDefault(); doContinue(); }, { passive: false });
      }
    }

    // ---------- input ----------
    function changeLane(dir) {
      if (state !== 'running') return;
      laneIndex = Math.max(0, Math.min(2, laneIndex + dir));
    }
    function doJump() {
      if (state !== 'running' || ducking) return;
      if (!jumping) {
        jumpVy = jumpBoostT > 0 ? BASE_JUMP_V * JUMP_BOOST_MULT : BASE_JUMP_V;
        jumping = true;
      }
    }
    function doDuck() {
      if (state !== 'running' || jumping) return;
      ducking = true;
      duckTimer = DUCK_TIME;
    }
    function activateHoverboard() {
      if (state !== 'running') return;
      if (hoverT > 0 || hoverStock <= 0) return;
      hoverStock--;
      hoverT = HOVER_DURATION;
      board.visible = true;
      updateBuffsUI();
    }

    let lastTapTime = 0;
    let touchStartX = 0, touchStartY = 0, touchActive = false;

    function onPointerDown(x, y) {
      if (state === 'ready') { startRun(); return; }
      touchStartX = x; touchStartY = y; touchActive = true;
      const now = performance.now();
      if (now - lastTapTime < DOUBLE_TAP_MS) {
        activateHoverboard();
      }
      lastTapTime = now;
    }
    function onPointerUp(x, y) {
      if (!touchActive) return;
      touchActive = false;
      const dx = x - touchStartX;
      const dy = y - touchStartY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 18) return; // treat as a tap, not swipe
      if (adx > ady) {
        changeLane(dx > 0 ? 1 : -1);
      } else {
        if (dy < 0) doJump(); else doDuck();
      }
    }

    function onTouchStart(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      onPointerDown(t.clientX, t.clientY);
    }
    function onTouchEnd(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      onPointerUp(t.clientX, t.clientY);
    }
    function onMouseDown(e) { onPointerDown(e.clientX, e.clientY); }
    function onMouseUp(e) { onPointerUp(e.clientX, e.clientY); }

    function onKey(e) {
      if (state === 'ready' && (e.code === 'Space' || e.code.startsWith('Arrow'))) { startRun(); return; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeLane(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeLane(1);
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { e.preventDefault(); doJump(); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') doDuck();
      else if (e.code === 'KeyH') activateHoverboard();
    }

    holder.addEventListener('touchstart', onTouchStart, { passive: false });
    holder.addEventListener('touchend', onTouchEnd, { passive: false });
    holder.addEventListener('mousedown', onMouseDown);
    holder.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKey);
    startBtn.addEventListener('click', startRun);
    startBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRun(); }, { passive: false });

    function onResize() {
      setHolderSize();
      camera.aspect = holder.clientWidth / holder.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(holder.clientWidth, holder.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // ---------- main loop ----------
    const clock = new THREE.Clock();
    let rafId;

    function updateRunning(dt) {
      distance += speed * dt;
      distSinceGate += speed * dt;
      speed = Math.min(MAX_SPEED, BASE_SPEED + distance * SPEED_RAMP);

      // lane lerp
      const targetX = LANES[laneIndex];
      playerX += (targetX - playerX) * Math.min(1, LANE_LERP * dt);

      // jump physics
      if (jumping) {
        playerY += jumpVy * dt;
        jumpVy += GRAVITY * dt;
        if (playerY <= 0) { playerY = 0; jumping = false; jumpVy = 0; }
      }
      // duck timer
      if (ducking) {
        duckTimer -= dt;
        if (duckTimer <= 0) ducking = false;
      }

      // buff timers
      if (jumpBoostT > 0) jumpBoostT = Math.max(0, jumpBoostT - dt);
      if (magnetT > 0) magnetT = Math.max(0, magnetT - dt);
      if (hoverT > 0) {
        hoverT = Math.max(0, hoverT - dt);
        if (hoverT === 0) board.visible = false;
      }
      if (invulnT > 0) invulnT = Math.max(0, invulnT - dt);

      // move ground segments
      segments.forEach((seg) => {
        seg.position.z += speed * dt;
        if (seg.position.z > SEG_LEN) seg.position.z -= SEG_LEN * NUM_SEG;
      });
      // move trees
      trees.forEach((t) => {
        t.position.z += speed * dt * 0.98;
        if (t.position.z > 6) {
          t.position.z -= 100 + Math.random() * 20;
          placeTree(t);
        }
      });
      // move police (keeps a light chase-distance breathing effect)
      const chaseTarget = 4.0 + Math.sin(distance * 0.15) * 0.6;
      police.position.z += (chaseTarget - police.position.z) * Math.min(1, 3 * dt);
      police.position.x += (playerX - police.position.x) * Math.min(1, 2 * dt);

      // spawn patterns
      if (distance > nextSpawnAt) {
        spawnPattern(SPAWN_Z);
        nextSpawnAt += PATTERN_SPACING;
      }
      if (distSinceGate > GATE_SPACING && continueTokens < CONTINUE_MAX) {
        addEntity('gate', 'gate', 1, SPAWN_Z - 6);
        distSinceGate = 0;
      }

      // move + resolve entities
      const playerHeight = ducking ? 0.55 : (0.05 + (jumping ? playerY : 0));
      const playerTop = ducking ? 0.9 : (1.9 + (jumping ? playerY : 0));

      for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.z += speed * dt;
        ent.mesh.position.z = ent.z;
        if (ent.kind === 'coin') ent.mesh.rotation.y += dt * 4;

        // magnet auto-suck: pull nearby upcoming coins toward the player's lane
        if (ent.kind === 'coin' && magnetT > 0 && !ent.collected && ent.z < 0 && ent.z > SPAWN_Z * 0.4) {
          ent.mesh.position.x += (playerX - ent.mesh.position.x) * Math.min(1, 3 * dt);
        }

        const nearPlayer = ent.z > -0.7 && ent.z < 0.7;
        const laneMatch = Math.abs(ent.mesh.position.x - playerX) < 1.0;

        if (!ent.collected && nearPlayer) {
          if (ent.kind === 'coin' && (laneMatch || magnetT > 0)) {
            ent.collected = true;
            coins++;
            coinsEl.textContent = String(coins);
          } else if (ent.kind === 'powerup' && laneMatch) {
            ent.collected = true;
            if (ent.type === 'jump') jumpBoostT = JUMP_BOOST_DURATION;
            else if (ent.type === 'magnet') magnetT = MAGNET_DURATION;
            else if (ent.type === 'hover') hoverStock = Math.min(HOVER_MAX_STOCK, hoverStock + 1);
            updateBuffsUI();
          } else if (ent.kind === 'gate' && ent.z > -1 && ent.z < 1) {
            ent.collected = true;
            continueTokens = Math.min(CONTINUE_MAX, continueTokens + 1);
          } else if (ent.kind === 'obstacle' && laneMatch && hoverT === 0 && invulnT === 0) {
            let hit = false;
            if (ent.type === 'train') hit = true;
            else if (ent.type === 'low') hit = !(jumping && playerY > 0.55);
            else if (ent.type === 'high') hit = !ducking;
            if (hit) {
              ent.collected = true;
              crash();
            }
          }
        }

        if (ent.z > DESPAWN_Z) {
          scene.remove(ent.mesh);
          entities.splice(i, 1);
        } else if (ent.collected && ent.kind !== 'obstacle') {
          scene.remove(ent.mesh);
          entities.splice(i, 1);
        }
      }

      scoreEl.textContent = String(Math.floor(distance) + coins * 5);
      updateBuffsUI();
    }

    function updatePlayerVisual(dt) {
      player.position.x = playerX;
      const baseY = ducking ? 0.15 : 0;
      player.position.y = baseY + (jumping ? playerY : 0);
      player.scale.y = ducking ? 0.6 : 1;

      walkClock += dt * (state === 'running' ? (6 + speed * 0.3) : 0);
      if (!jumping && !ducking) {
        const swing = Math.sin(walkClock) * 0.55;
        legL.rotation.x = swing;
        legR.rotation.x = -swing;
        armL.rotation.x = -swing;
        armR.rotation.x = swing;
      } else {
        legL.rotation.x = THREE.MathUtils ? THREE.MathUtils.lerp(legL.rotation.x, 0, 0.2) : legL.rotation.x * 0.8;
        legR.rotation.x = legR.rotation.x * 0.8;
        armL.rotation.x = armL.rotation.x * 0.8;
        armR.rotation.x = armR.rotation.x * 0.8;
      }

      const glow = jumpBoostT > 0 ? 0x552200 : 0x330011;
      hoodieMat.emissive.setHex(glow);

      // police officer running animation (chases just behind the player)
      const policeSwing = Math.sin(walkClock * 1.05 + Math.PI * 0.3) * 0.6;
      policeLegL.rotation.x = policeSwing;
      policeLegR.rotation.x = -policeSwing;
      policeArmL.rotation.x = -policeSwing;
      policeArmR.rotation.x = policeSwing;
      police.position.y = Math.abs(Math.sin(walkClock * 1.05)) * 0.05;

      camera.position.x += (playerX * 0.5 - (camera.position.x - 0)) * Math.min(1, 6 * dt) * 0 + (playerX * 0.35 - camera.position.x * 0);
      camera.position.x = playerX * 0.35;
      camera.position.y = 4.6 - (ducking ? 0.3 : 0);
      camera.lookAt(playerX * 0.6, 1.4, -6);
    }

    function loop() {
      const dt = Math.min(0.05, clock.getDelta());
      if (state === 'running') {
        updateRunning(dt);
      }
      updatePlayerVisual(dt);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    }

    resetRunState();
    loop();

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        holder.removeEventListener('touchstart', onTouchStart);
        holder.removeEventListener('touchend', onTouchEnd);
        holder.removeEventListener('mousedown', onMouseDown);
        holder.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('keydown', onKey);
        renderer.dispose();
        wrap.remove();
      },
    };
  }

  let instance = null;
  window.NexusGames = window.NexusGames || {};
  window.NexusGames.metroDash = {
    mount(container) {
      const loadingEl = document.createElement('div');
      loadingEl.textContent = 'LOADING 3D ENGINE...';
      loadingEl.style.cssText = 'color:#00f6ff;text-align:center;padding:50px 10px;font-family:Orbitron,sans-serif;letter-spacing:.1em;';
      container.appendChild(loadingEl);
      loadThree()
        .then((THREE) => {
          loadingEl.remove();
          instance = createGame(container, THREE);
        })
        .catch(() => {
          loadingEl.textContent = '3D ENGINE FAILED TO LOAD — CHECK CONNECTION';
        });
    },
    unmount() {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
