/* Subway Surfers — plugs into NexusGames.subwaySurfers { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.subwaySurfers = {
    mount(container) {
      const W = 360, H = 480;
      const LANES = [W * 0.25, W * 0.5, W * 0.75];
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="ss-score">0</b></span><span>BEST: <b id="ss-best">0</b></span></div>
        <canvas id="ss-canvas" width="${W}" height="${H}" style="background:#0a0e14;border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <p style="font-size:12px;opacity:.6;">&larr;&rarr; switch lane &middot; &uarr; jump &middot; &darr; duck</p>
        <div id="ss-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">CAUGHT!</p>
          <button id="ss-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#ss-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#ss-score');
      const bestEl = wrap.querySelector('#ss-best');
      const overEl = wrap.querySelector('#ss-over');
      const restartBtn = wrap.querySelector('#ss-restart');

      let best = Number(localStorage.getItem('nexus-subway-best') || 0);
      bestEl.textContent = best;

      const PLAYER_Y = H - 100;
      let lane, player, obstacles, speed, score, alive, raf, spawnTimer;

      function reset() {
        lane = 1;
        player = { y: 0, vy: 0, jumping: false, ducking: false };
        obstacles = [];
        speed = 4.5;
        score = 0;
        alive = true;
        spawnTimer = 0;
        scoreEl.textContent = score;
        overEl.style.display = 'none';
      }

      function spawn() {
        const l = Math.floor(Math.random() * 3);
        const type = Math.random() < 0.5 ? 'block' : 'low';
        obstacles.push({ lane: l, y: -40, type });
      }

      function update() {
        speed = 4.5 + Math.min(4, score * 0.002);
        spawnTimer -= speed;
        if (spawnTimer <= 0) {
          spawn();
          spawnTimer = 90;
        }

        if (player.jumping) {
          player.vy += 0.7;
          player.y += player.vy;
          if (player.y >= 0) { player.y = 0; player.jumping = false; player.vy = 0; }
        }

        obstacles.forEach(o => { o.y += speed; });
        obstacles = obstacles.filter(o => o.y < H + 40);

        score++;
        scoreEl.textContent = score;

        obstacles.forEach(o => {
          if (Math.abs(o.y - PLAYER_Y) < 24 && o.lane === lane) {
            const dodgedByJump = o.type === 'block' && player.jumping && player.y < -30;
            const dodgedByDuck = o.type === 'low' && player.ducking;
            if (!dodgedByJump && !dodgedByDuck) {
              alive = false;
              if (score > best) {
                best = score;
                localStorage.setItem('nexus-subway-best', String(best));
                bestEl.textContent = best;
              }
              overEl.style.display = 'flex';
            }
          }
        });
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        [0.125, 0.375, 0.625, 0.875].forEach(f => {
          ctx.beginPath(); ctx.moveTo(W * f, 0); ctx.lineTo(W * f, H); ctx.stroke();
        });

        obstacles.forEach(o => {
          ctx.fillStyle = o.type === 'block' ? '#ff2d78' : '#ffd60a';
          const h = o.type === 'block' ? 40 : 18;
          const y = o.type === 'block' ? o.y - h : o.y - h / 2;
          ctx.fillRect(LANES[o.lane] - 20, y, 40, h);
        });

        const py = PLAYER_Y + player.y;
        const ph = player.ducking ? 20 : 40;
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(LANES[lane] - 14, py - ph, 28, ph);
      }

      function loop() {
        if (alive) {
          update();
          draw();
          raf = requestAnimationFrame(loop);
        } else {
          draw();
        }
      }

      function onKey(e) {
        if (!alive) return;
        if (e.key === 'ArrowLeft') lane = Math.max(0, lane - 1);
        else if (e.key === 'ArrowRight') lane = Math.min(2, lane + 1);
        else if (e.key === 'ArrowUp') { if (!player.jumping) { player.jumping = true; player.vy = -13; } }
        else if (e.key === 'ArrowDown') { player.ducking = true; }
        else return;
        e.preventDefault();
      }
      function onKeyUp(e) { if (e.key === 'ArrowDown') player.ducking = false; }

      document.addEventListener('keydown', onKey);
      document.addEventListener('keyup', onKeyUp);
      restartBtn.addEventListener('click', () => { reset(); raf = requestAnimationFrame(loop); });

      reset();
      draw();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keyup', onKeyUp);
      };
    },

    unmount(container) {
      if (this._cleanup) this._cleanup();
      this._cleanup = null;
      container.innerHTML = '';
    },
  };
})();
