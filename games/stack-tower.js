/* Stack Tower — plugs into NexusGames.stackTower { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.stackTower = {
    mount(container) {
      const W = 320, H = 480;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>HEIGHT: <b id="stk-score">0</b></span><span>BEST: <b id="stk-best">0</b></span></div>
        <canvas id="stk-canvas" width="${W}" height="${H}" style="background:linear-gradient(180deg,#141a24,#0a0e14);border:1px solid rgba(255,255,255,.15);border-radius:8px;cursor:pointer;"></canvas>
        <p style="font-size:12px;opacity:.6;">Click / Space to drop the block</p>
        <div id="stk-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">TOWER COLLAPSED</p>
          <button id="stk-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#stk-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#stk-score');
      const bestEl = wrap.querySelector('#stk-best');
      const overEl = wrap.querySelector('#stk-over');
      const restartBtn = wrap.querySelector('#stk-restart');

      let best = Number(localStorage.getItem('nexus-stack-best') || 0);
      bestEl.textContent = best;

      const BLOCK_H = 24;
      const COLORS = ['#00e5ff', '#39ff14', '#ff2d78', '#ffd60a', '#5c7cff'];
      let stack, current, score, alive, raf, camOffset;

      function reset() {
        stack = [{ x: W / 2 - 60, w: 120, colorI: 0 }];
        current = newBlock(0);
        score = 0;
        alive = true;
        camOffset = 0;
        scoreEl.textContent = score;
        overEl.style.display = 'none';
      }

      function newBlock(index) {
        const base = stack[stack.length - 1];
        const dir = Math.random() < 0.5 ? -1 : 1;
        return {
          x: dir === 1 ? -base.w : W + base.w,
          w: base.w,
          speed: 3 + Math.min(4, index * 0.15),
          dir,
          colorI: index % COLORS.length,
        };
      }

      function drop() {
        if (!alive) return;
        const base = stack[stack.length - 1];
        const left = Math.max(current.x, base.x);
        const right = Math.min(current.x + current.w, base.x + base.w);
        const overlap = right - left;

        if (overlap <= 4) {
          alive = false;
          if (score > best) {
            best = score;
            localStorage.setItem('nexus-stack-best', String(best));
            bestEl.textContent = best;
          }
          overEl.style.display = 'flex';
          return;
        }

        const newBlockPlaced = { x: left, w: overlap, colorI: current.colorI };
        stack.push(newBlockPlaced);
        score++;
        scoreEl.textContent = score;
        current = newBlock(stack.length);
        if (stack.length > 8) camOffset = (stack.length - 8) * BLOCK_H;
      }

      function update() {
        if (!alive) return;
        current.x += current.speed * current.dir;
        if (current.x <= -current.w || current.x >= W) current.dir *= -1;
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        stack.forEach((b, i) => {
          const y = H - 40 - i * BLOCK_H + camOffset;
          if (y < -BLOCK_H || y > H) return;
          ctx.fillStyle = COLORS[b.colorI];
          ctx.fillRect(b.x, y, b.w, BLOCK_H - 2);
        });

        if (alive) {
          const y = H - 40 - stack.length * BLOCK_H + camOffset;
          ctx.fillStyle = COLORS[current.colorI];
          ctx.globalAlpha = 0.9;
          ctx.fillRect(current.x, y, current.w, BLOCK_H - 2);
          ctx.globalAlpha = 1;
        }
      }

      function loop() {
        update();
        draw();
        raf = requestAnimationFrame(loop);
      }

      function onClick() { drop(); }
      function onKey(e) { if (e.key === ' ') { e.preventDefault(); drop(); } }

      canvas.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
      restartBtn.addEventListener('click', reset);

      reset();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('click', onClick);
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
