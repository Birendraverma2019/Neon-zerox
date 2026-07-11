/* Temple Run — plugs into NexusGames.templeRun { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.templeRun = {
    mount(container) {
      const W = 360, H = 480;
      const LANES = [W * 0.25, W * 0.5, W * 0.75];
      const GROUND = H - 90;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>DISTANCE: <b id="tr-score">0</b>m</span><span>BEST: <b id="tr-best">0</b>m</span></div>
        <canvas id="tr-canvas" width="${W}" height="${H}" style="background:linear-gradient(180deg,#1a1208,#0a0e14);border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <p style="font-size:12px;opacity:.6;">&larr;&rarr; swerve &middot; &uarr; jump &middot; &darr; slide</p>
        <div id="tr-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">THE CURSE GOT YOU</p>
          <button id="tr-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#tr-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#tr-score');
      const bestEl = wrap.querySelector('#tr-best');
      const overEl = wrap.querySelector('#tr-over');
      const restartBtn = wrap.querySelector('#tr-restart');

      let best = Number(localStorage.getItem('nexus-temple-best') || 0);
      bestEl.textContent = best;

      let lane, player, obstacles, coins, speed, dist, alive, raf, spawnTimer;

      function reset() {
        lane = 1;
        player = { z: 0, vz: 0, jumping: false, sliding: false };
        obstacles = [];
        coins = [];
        speed = 5;
        dist = 0;
        alive = true;
        spawnTimer = 0;
        scoreEl.textContent = 0;
        overEl.style.display = 'none';
      }

      function spawn() {
        const l = Math.floor(Math.random() * 3);
        const type = Math.random() < 0.45 ? 'gap' : 'log';
        obstacles.push({ lane: l, y: -40, type });
        if (Math.random() < 0.4) {
          coins.push({ lane: (l + 1) % 3, y: -80 });
        }
      }

      function update() {
        speed = 5 + Math.min(4, dist * 0.002);
        spawnTimer -= speed;
        if (spawnTimer <= 0) { spawn(); spawnTimer = 95; }

        if (player.jumping) {
          player.vz += 0.7;
          player.z += player.vz;
          if (player.z >= 0) { player.z = 0; player.jumping = false; player.vz = 0; }
        }

        obstacles.forEach(o => { o.y += speed; });
        obstacles = obstacles.filter(o => o.y < H + 40);
        coins.forEach(c => { c.y += speed; });
        coins = coins.filter(c => c.y < H + 40);

        dist += speed * 0.05;
        scoreEl.textContent = Math.floor(dist);

        obstacles.forEach(o => {
          if (Math.abs(o.y - GROUND) < 22 && o.lane === lane) {
            const dodgedJump = o.type === 'gap' && player.jumping && player.z < -30;
            const dodgedSlide = o.type === 'log' && player.sliding;
            if (!dodgedJump && !dodgedSlide) {
              alive = false;
              const finalDist = Math.floor(dist);
              if (finalDist > best) {
                best = finalDist;
                localStorage.setItem('nexus-temple-best', String(best));
                bestEl.textContent = best;
              }
              overEl.style.display = 'flex';
            }
          }
        });

        coins = coins.filter(c => {
          if (Math.abs(c.y - GROUND) < 24 && c.lane === lane) {
            dist += 5;
            return false;
          }
          return true;
        });
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255,183,3,.15)';
        [0.125, 0.375, 0.625, 0.875].forEach(f => {
          ctx.beginPath(); ctx.moveTo(W * f, 0); ctx.lineTo(W * f, H); ctx.stroke();
        });

        coins.forEach(c => {
          ctx.fillStyle = '#ffd60a';
          ctx.beginPath();
          ctx.arc(LANES[c.lane], c.y, 8, 0, Math.PI * 2);
          ctx.fill();
        });

        obstacles.forEach(o => {
          if (o.type === 'gap') {
            ctx.fillStyle = '#000';
            ctx.fillRect(LANES[o.lane] - 22, o.y - 10, 44, 20);
            ctx.strokeStyle = '#ff2d78';
            ctx.strokeRect(LANES[o.lane] - 22, o.y - 10, 44, 20);
          } else {
            ctx.fillStyle = '#8a5a2b';
            ctx.fillRect(LANES[o.lane] - 24, o.y - 8, 48, 16);
          }
        });

        const py = GROUND + player.z;
        const ph = player.sliding ? 20 : 42;
        ctx.fillStyle = '#39ff14';
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
        else if (e.key === 'ArrowUp') { if (!player.jumping) { player.jumping = true; player.vz = -13; } }
        else if (e.key === 'ArrowDown') { player.sliding = true; }
        else return;
        e.preventDefault();
      }
      function onKeyUp(e) { if (e.key === 'ArrowDown') player.sliding = false; }

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
