/* Geometry Dash — plugs into NexusGames.geometryDash { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.geometryDash = {
    mount(container) {
      const W = 500, H = 260;
      const GROUND = H - 40;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="gd-score">0</b></span><span>BEST: <b id="gd-best">0</b></span></div>
        <canvas id="gd-canvas" width="${W}" height="${H}" style="background:#0a0e14;border:1px solid rgba(255,255,255,.15);border-radius:8px;cursor:pointer;"></canvas>
        <p style="font-size:12px;opacity:.6;">Space / Click / Tap to jump &middot; clear the spikes</p>
        <div id="gd-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">CRASHED</p>
          <button id="gd-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#gd-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#gd-score');
      const bestEl = wrap.querySelector('#gd-best');
      const overEl = wrap.querySelector('#gd-over');
      const restartBtn = wrap.querySelector('#gd-restart');

      let best = Number(localStorage.getItem('nexus-gd-best') || 0);
      bestEl.textContent = best;

      const SIZE = 26;
      let player, obstacles, speed, score, alive, raf, spawnDist, rot;

      function reset() {
        player = { x: 60, y: GROUND - SIZE, vy: 0, onGround: true };
        obstacles = [];
        speed = 4.2;
        score = 0;
        alive = true;
        spawnDist = 0;
        rot = 0;
        scoreEl.textContent = score;
        overEl.style.display = 'none';
      }

      function jump() {
        if (alive && player.onGround) {
          player.vy = -9.5;
          player.onGround = false;
        }
      }

      function spawnObstacle() {
        const h = 24 + Math.random() * 14;
        obstacles.push({ x: W + 10, w: 20, h });
      }

      function update() {
        speed = 4.2 + Math.min(3, score * 0.03);
        spawnDist -= speed;
        if (spawnDist <= 0) {
          spawnObstacle();
          spawnDist = 130 + Math.random() * 90;
        }

        player.vy += 0.55;
        player.y += player.vy;
        if (player.y >= GROUND - SIZE) {
          player.y = GROUND - SIZE;
          player.vy = 0;
          player.onGround = true;
        } else {
          rot += 0.15;
        }

        obstacles.forEach(o => { o.x -= speed; });
        while (obstacles.length && obstacles[0].x < -30) {
          obstacles.shift();
          score++;
          scoreEl.textContent = score;
        }

        const px1 = player.x, px2 = player.x + SIZE, py1 = player.y, py2 = player.y + SIZE;
        obstacles.forEach(o => {
          const ox1 = o.x, ox2 = o.x + o.w, oy1 = GROUND - o.h, oy2 = GROUND;
          if (px2 > ox1 + 4 && px1 < ox2 - 4 && py2 > oy1 + 4) {
            alive = false;
            if (score > best) {
              best = score;
              localStorage.setItem('nexus-gd-best', String(best));
              bestEl.textContent = best;
            }
            overEl.style.display = 'flex';
          }
        });
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(0,229,255,.5)';
        ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

        ctx.fillStyle = '#ff2d78';
        obstacles.forEach(o => {
          ctx.beginPath();
          ctx.moveTo(o.x, GROUND);
          ctx.lineTo(o.x + o.w / 2, GROUND - o.h);
          ctx.lineTo(o.x + o.w, GROUND);
          ctx.closePath();
          ctx.fill();
        });

        ctx.save();
        ctx.translate(player.x + SIZE / 2, player.y + SIZE / 2);
        ctx.rotate(rot);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE);
        ctx.restore();
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

      function onKey(e) { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } }

      canvas.addEventListener('mousedown', jump);
      canvas.addEventListener('touchstart', jump, { passive: true });
      document.addEventListener('keydown', onKey);
      restartBtn.addEventListener('click', () => { reset(); raf = requestAnimationFrame(loop); });

      reset();
      draw();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('mousedown', jump);
        canvas.removeEventListener('touchstart', jump);
        document.removeEventListener('keydown', onKey);
      };
    },

    unmount(container) {
      if (this._cleanup) this._cleanup();
      this._cleanup = null;
      container.innerHTML = '';
    },
  };
})();
