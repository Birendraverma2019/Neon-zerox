/* ==================================================================
   NEXUS ARCADE — Cartridge: Box Runner
   Registers itself on window.NexusGames.boxRunner
   ================================================================== */
(() => {
  'use strict';

  const W = 320, H = 420;
  const GROUND_Y = H - 40;
  const GRAVITY = 0.6;
  const JUMP_V = -11;

  function createGame(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Orbitron,sans-serif;';
    wrap.innerHTML = `
      <div style="font-size:12px;letter-spacing:.08em;color:#b6ff2a;text-shadow:0 0 8px rgba(182,255,42,.5);">
        DISTANCE: <span data-role="score">0</span>m &nbsp;|&nbsp; BEST: <span data-role="best">0</span>m
      </div>
      <canvas width="${W}" height="${H}" style="background:#0a0d16;border:1px solid rgba(182,255,42,.4);border-radius:10px;box-shadow:0 0 20px rgba(182,255,42,.2);touch-action:manipulation;"></canvas>
      <div style="font-size:11px;color:#8b93ac;">TAP / CLICK / SPACE TO JUMP</div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('[data-role="score"]');
    const bestEl = wrap.querySelector('[data-role="best"]');

    let best = Number(localStorage.getItem('nexus_runner_best') || 0);
    bestEl.textContent = best;

    let box, obstacles, speed, distance, frame, running, rafId;

    function reset() {
      box = { x: 50, y: GROUND_Y - 26, w: 26, h: 26, vy: 0, onGround: true };
      obstacles = [];
      speed = 4.2;
      distance = 0;
      frame = 0;
      running = true;
      scoreEl.textContent = '0';
    }

    function spawnObstacle() {
      const h = 24 + Math.random() * 30;
      obstacles.push({ x: W + 20, y: GROUND_Y - h, w: 20, h });
    }

    function jump() {
      if (!running) { reset(); return; }
      if (box.onGround) {
        box.vy = JUMP_V;
        box.onGround = false;
      }
    }

    function endGame() {
      running = false;
      const meters = Math.floor(distance);
      if (meters > best) {
        best = meters;
        localStorage.setItem('nexus_runner_best', String(best));
        bestEl.textContent = best;
      }
    }

    function update() {
      frame++;
      distance += speed * 0.05;
      speed += 0.0025;
      scoreEl.textContent = String(Math.floor(distance));

      box.vy += GRAVITY;
      box.y += box.vy;
      if (box.y + box.h >= GROUND_Y) {
        box.y = GROUND_Y - box.h;
        box.vy = 0;
        box.onGround = true;
      }

      if (frame % Math.max(50, Math.floor(90 - speed * 4)) === 0) spawnObstacle();

      obstacles.forEach((o) => (o.x -= speed));
      while (obstacles.length && obstacles[0].x < -30) obstacles.shift();

      obstacles.forEach((o) => {
        const hit =
          box.x < o.x + o.w &&
          box.x + box.w > o.x &&
          box.y < o.y + o.h &&
          box.y + box.h > o.y;
        if (hit) endGame();
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ground
      ctx.strokeStyle = 'rgba(182,255,42,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();

      // scrolling grid dashes on ground for speed feel
      ctx.strokeStyle = 'rgba(182,255,42,0.15)';
      const dashOffset = (frame * 4) % 30;
      for (let x = -30 + dashOffset; x < W; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 6);
        ctx.lineTo(x + 14, GROUND_Y + 6);
        ctx.stroke();
      }

      // obstacles
      ctx.fillStyle = 'rgba(255,46,230,0.2)';
      ctx.strokeStyle = '#ff2ee6';
      obstacles.forEach((o) => {
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      });

      // player box
      ctx.fillStyle = '#b6ff2a';
      ctx.shadowColor = '#b6ff2a';
      ctx.shadowBlur = 14;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.shadowBlur = 0;

      if (!running) {
        ctx.fillStyle = 'rgba(5,6,11,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#eaf2ff';
        ctx.font = '16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM CRASH', W / 2, H / 2 - 10);
        ctx.font = '11px Orbitron, sans-serif';
        ctx.fillStyle = '#8b93ac';
        ctx.fillText('CLICK / TAP TO RESTART', W / 2, H / 2 + 16);
      }
    }

    function loop() {
      if (running) update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function onKey(e) {
      if (e.code === 'Space') { e.preventDefault(); jump(); }
    }

    canvas.addEventListener('pointerdown', jump);
    document.addEventListener('keydown', onKey);

    reset();
    loop();

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('pointerdown', jump);
        document.removeEventListener('keydown', onKey);
        wrap.remove();
      },
    };
  }

  let instance = null;
  window.NexusGames = window.NexusGames || {};
  window.NexusGames.boxRunner = {
    mount(container) { instance = createGame(container); },
    unmount() {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
