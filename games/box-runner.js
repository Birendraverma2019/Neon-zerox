/* ==================================================================
   NEXUS ARCADE — Cartridge: Box Runner
   Registers itself on window.NexusGames.boxRunner
   Gameplay/feel ported from the "Fast 2D Runner" HTML build.
   Input: keyboard (Space), mouse (mousedown) and touch (touchstart)
   are all wired independently for max compatibility across old and
   new browsers/devices (desktop + mobile).
   ================================================================== */
(() => {
  'use strict';

  const W = 320, H = 420;
  const GROUND_Y = H - 50;      // matches HTML's 50px ground height
  const GRAVITY = 0.6;          // same feel as the HTML build
  const JUMP_V = -12;           // same jumpForce as the HTML build

  function createGame(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Orbitron,sans-serif;padding-top:48px;box-sizing:border-box;width:100%;';
    wrap.innerHTML = `
      <div style="font-size:12px;letter-spacing:.08em;color:#ff007f;text-shadow:0 0 8px rgba(255,0,127,.5);">
        SCORE: <span data-role="score">0</span> &nbsp;|&nbsp; BEST: <span data-role="best">0</span>
      </div>
      <canvas width="${W}" height="${H}" style="background:linear-gradient(to bottom,#1a0b2e,#4c1c5c);border-radius:10px;box-shadow:0 0 20px rgba(255,0,127,.25);touch-action:manipulation;"></canvas>
      <div style="font-size:11px;color:#8b93ac;">TAP / CLICK / SPACE TO JUMP</div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('[data-role="score"]');
    const bestEl = wrap.querySelector('[data-role="best"]');

    let best = Number(localStorage.getItem('nexus_runner_best') || 0);
    bestEl.textContent = best;

    // ---- Speed scaling (smooth, keeps climbing with score, same idea as Flappy) ----
    const baseSpeed = 5;
    const maxSpeed = 14;
    const speedPerPoint = 0.15;

    let box, obstacles, speed, score, running, rafId;
    let framesToNextSpawn = 0;

    function randomSpawnGap() {
      // HTML build spawned every 900-1800ms; convert to ~frames at 60fps
      return Math.floor(54 + Math.random() * 54); // ~54-108 frames
    }

    function reset() {
      box = { x: 50, y: GROUND_Y - 34, w: 34, h: 34, vy: 0, onGround: true };
      obstacles = [];
      speed = baseSpeed;
      score = 0;
      running = true;
      framesToNextSpawn = randomSpawnGap();
      scoreEl.textContent = '0';
    }

    function spawnObstacle() {
      obstacles.push({ x: W + 20, y: GROUND_Y - 45, w: 30, h: 45 });
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
      if (score > best) {
        best = score;
        localStorage.setItem('nexus_runner_best', String(best));
        bestEl.textContent = best;
      }
    }

    function update() {
      box.vy += GRAVITY;
      box.y += box.vy;
      if (box.y + box.h >= GROUND_Y) {
        box.y = GROUND_Y - box.h;
        box.vy = 0;
        box.onGround = true;
      }

      framesToNextSpawn--;
      if (framesToNextSpawn <= 0) {
        spawnObstacle();
        framesToNextSpawn = randomSpawnGap();
      }

      obstacles.forEach((o) => (o.x -= speed));

      obstacles.forEach((o, index) => {
        const hit =
          box.x < o.x + o.w &&
          box.x + box.w > o.x &&
          box.y < o.y + o.h &&
          box.y + box.h > o.y;
        if (hit) endGame();

        if (o.x + o.w < -30) {
          obstacles.splice(index, 1);
          score++;
          scoreEl.textContent = String(score);
          speed = Math.min(maxSpeed, baseSpeed + score * speedPerPoint);
        }
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ground
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, GROUND_Y + 2, W, H - GROUND_Y - 2);

      // obstacles
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      obstacles.forEach((o) => {
        ctx.fillRect(o.x, o.y, o.w, o.h);
      });
      ctx.shadowBlur = 0;

      // player
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 10;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.shadowBlur = 0;

      if (!running) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff007f';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('गेम ओवर!', W / 2, H / 2 - 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('स्कोर: ' + score, W / 2, H / 2 + 6);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#8b93ac';
        ctx.fillText('TAP / CLICK / SPACE TO RESTART', W / 2, H / 2 + 30);
        ctx.textAlign = 'left';
      }
    }

    function loop() {
      if (running) update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function onKey(e) {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
        jump();
      }
    }

    function onTouch(e) {
      e.preventDefault();
      jump();
    }

    function onMouse() {
      jump();
    }

    // Wired independently (not just pointerdown) so old and new
    // browsers on both desktop and mobile all respond reliably.
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    canvas.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);

    reset();
    loop();

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('touchstart', onTouch);
        canvas.removeEventListener('mousedown', onMouse);
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
