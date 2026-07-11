/* Doodle Jump — plugs into NexusGames.doodleJump { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.doodleJump = {
    mount(container) {
      const W = 300, H = 460;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="dj-score">0</b></span><span>BEST: <b id="dj-best">0</b></span></div>
        <canvas id="dj-canvas" width="${W}" height="${H}" style="background:linear-gradient(180deg,#141a24,#0a0e14);border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <p style="font-size:12px;opacity:.6;">&larr;&rarr; or A/D to move &middot; auto-bounces upward</p>
        <div id="dj-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">YOU FELL!</p>
          <button id="dj-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#dj-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#dj-score');
      const bestEl = wrap.querySelector('#dj-best');
      const overEl = wrap.querySelector('#dj-over');
      const restartBtn = wrap.querySelector('#dj-restart');

      let best = Number(localStorage.getItem('nexus-doodle-best') || 0);
      bestEl.textContent = best;

      const PW = 20, PH = 20, PLAT_W = 54, PLAT_H = 10;
      let player, platforms, score, alive, raf, keys, maxHeight;

      function reset() {
        player = { x: W / 2 - PW / 2, y: H - 60, vy: -10, vx: 0 };
        platforms = [];
        for (let i = 0; i < 8; i++) {
          platforms.push({ x: Math.random() * (W - PLAT_W), y: H - i * 60 });
        }
        score = 0;
        alive = true;
        maxHeight = player.y;
        keys = {};
        scoreEl.textContent = score;
        overEl.style.display = 'none';
      }

      function update() {
        if (keys.left) player.vx = -4;
        else if (keys.right) player.vx = 4;
        else player.vx *= 0.85;

        player.x += player.vx;
        if (player.x < -PW) player.x = W;
        if (player.x > W) player.x = -PW;

        player.vy += 0.35;
        player.y += player.vy;

        if (player.vy > 0) {
          platforms.forEach(p => {
            if (player.x + PW > p.x && player.x < p.x + PLAT_W &&
                player.y + PH > p.y && player.y + PH < p.y + PLAT_H + player.vy) {
              player.vy = -10.5;
            }
          });
        }

        const scrollThreshold = H / 2;
        if (player.y < scrollThreshold) {
          const dy = scrollThreshold - player.y;
          player.y = scrollThreshold;
          platforms.forEach(p => { p.y += dy; });
          score += Math.round(dy);
          scoreEl.textContent = score;
        }

        platforms = platforms.filter(p => p.y < H + 20);
        while (platforms.length < 8) {
          const highestY = Math.min(...platforms.map(p => p.y));
          platforms.push({ x: Math.random() * (W - PLAT_W), y: highestY - (50 + Math.random() * 30) });
        }

        if (player.y > H) {
          alive = false;
          if (score > best) {
            best = score;
            localStorage.setItem('nexus-doodle-best', String(best));
            bestEl.textContent = best;
          }
          overEl.style.display = 'flex';
        }
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#39ff14';
        platforms.forEach(p => {
          ctx.fillRect(p.x, p.y, PLAT_W, PLAT_H);
        });

        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(player.x, player.y, PW, PH);
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(player.x + 4, player.y + 5, 4, 4);
        ctx.fillRect(player.x + 12, player.y + 5, 4, 4);
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

      function onKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
      }
      function onKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
      }

      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      restartBtn.addEventListener('click', () => { reset(); raf = requestAnimationFrame(loop); });

      reset();
      draw();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKeyDown);
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
