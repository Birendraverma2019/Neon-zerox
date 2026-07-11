/* 8 Ball Pool — plugs into NexusGames.eightBallPool { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.eightBallPool = {
    mount(container) {
      const W = 460, H = 260;
      const R = 8;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>POCKETED: <b id="pool-score">0</b></span><span id="pool-status">Aim &amp; drag to shoot</span></div>
        <canvas id="pool-canvas" width="${W}" height="${H}" style="background:#0a3d1f;border:6px solid #5c3a21;border-radius:8px;cursor:crosshair;"></canvas>
        <p style="font-size:12px;opacity:.6;">Drag back from cue ball, release to shoot</p>
        <button id="pool-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#pool-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#pool-score');
      const statusEl = wrap.querySelector('#pool-status');
      const restartBtn = wrap.querySelector('#pool-restart');

      const POCKETS = [
        { x: 10, y: 10 }, { x: W / 2, y: 6 }, { x: W - 10, y: 10 },
        { x: 10, y: H - 10 }, { x: W / 2, y: H - 6 }, { x: W - 10, y: H - 10 },
      ];
      const POCKET_R = 13;
      const COLORS = ['#fff', '#ffd60a', '#00e5ff', '#ff2d78', '#5c7cff', '#ff5c9a', '#39ff14', '#ffb703', '#111'];

      let balls, score, dragging, dragStart, aiming, raf, moving;

      function rack() {
        balls = [];
        balls.push({ x: 90, y: H / 2, vx: 0, vy: 0, color: COLORS[0], cue: true, pocketed: false });
        let id = 1;
        const startX = 330, startY = H / 2;
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col <= row; col++) {
            balls.push({
              x: startX + row * (R * 1.8),
              y: startY - row * R + col * R * 2,
              vx: 0, vy: 0,
              color: COLORS[id % COLORS.length],
              cue: false, pocketed: false,
            });
            id++;
          }
        }
      }

      function reset() {
        rack();
        score = 0;
        dragging = false;
        aiming = null;
        moving = false;
        scoreEl.textContent = score;
        statusEl.textContent = 'Aim & drag to shoot';
      }

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: (t.clientX - rect.left) * (W / rect.width), y: (t.clientY - rect.top) * (H / rect.height) };
      }

      function cueBall() { return balls.find(b => b.cue && !b.pocketed); }

      function pointerDown(e) {
        if (moving) return;
        const cue = cueBall();
        if (!cue) return;
        const p = getPos(e);
        if (Math.hypot(p.x - cue.x, p.y - cue.y) < 40) {
          dragging = true;
          dragStart = p;
        }
      }
      function pointerMove(e) {
        if (!dragging) return;
        aiming = getPos(e);
      }
      function pointerUp() {
        if (!dragging || !aiming) { dragging = false; return; }
        const cue = cueBall();
        const dx = cue.x - aiming.x, dy = cue.y - aiming.y;
        const power = Math.min(14, Math.hypot(dx, dy) * 0.18);
        const d = Math.hypot(dx, dy) || 1;
        cue.vx = (dx / d) * power;
        cue.vy = (dy / d) * power;
        dragging = false;
        aiming = null;
        moving = true;
        statusEl.textContent = 'Rolling...';
      }

      function physics() {
        let anyMoving = false;
        balls.forEach(b => {
          if (b.pocketed) return;
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.985;
          b.vy *= 0.985;
          if (Math.abs(b.vx) < 0.05) b.vx = 0;
          if (Math.abs(b.vy) < 0.05) b.vy = 0;
          if (b.vx || b.vy) anyMoving = true;

          if (b.x - R < 6) { b.x = 6 + R; b.vx *= -1; }
          if (b.x + R > W - 6) { b.x = W - 6 - R; b.vx *= -1; }
          if (b.y - R < 6) { b.y = 6 + R; b.vy *= -1; }
          if (b.y + R > H - 6) { b.y = H - 6 - R; b.vy *= -1; }
        });

        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i], b = balls[j];
            if (a.pocketed || b.pocketed) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < R * 2) {
              const overlap = R * 2 - dist;
              const nx = dx / dist, ny = dy / dist;
              a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
              b.x += nx * overlap / 2; b.y += ny * overlap / 2;
              const avx = a.vx, avy = a.vy;
              a.vx = b.vx; a.vy = b.vy;
              b.vx = avx; b.vy = avy;
              anyMoving = true;
            }
          }
        }

        balls.forEach(b => {
          if (b.pocketed) return;
          POCKETS.forEach(p => {
            if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET_R) {
              b.pocketed = true;
              b.vx = 0; b.vy = 0;
              if (!b.cue) {
                score++;
                scoreEl.textContent = score;
              } else {
                // scratch: respawn cue ball
                b.x = 90; b.y = H / 2; b.pocketed = false;
              }
            }
          });
        });

        moving = anyMoving;
        if (!moving) statusEl.textContent = 'Aim & drag to shoot';
      }

      function draw() {
        ctx.fillStyle = '#0a3d1f';
        ctx.fillRect(0, 0, W, H);

        POCKETS.forEach(p => {
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
          ctx.fill();
        });

        balls.forEach(b => {
          if (b.pocketed) return;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.3)';
          ctx.stroke();
        });

        if (dragging && aiming) {
          const cue = cueBall();
          ctx.strokeStyle = 'rgba(255,255,255,.6)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cue.x, cue.y);
          const dx = cue.x - aiming.x, dy = cue.y - aiming.y;
          ctx.lineTo(cue.x + dx * 3, cue.y + dy * 3);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      function loop() {
        physics();
        draw();
        raf = requestAnimationFrame(loop);
      }

      canvas.addEventListener('mousedown', pointerDown);
      canvas.addEventListener('mousemove', pointerMove);
      window.addEventListener('mouseup', pointerUp);
      canvas.addEventListener('touchstart', pointerDown, { passive: true });
      canvas.addEventListener('touchmove', pointerMove, { passive: true });
      canvas.addEventListener('touchend', pointerUp);
      restartBtn.addEventListener('click', reset);

      reset();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('mousedown', pointerDown);
        canvas.removeEventListener('mousemove', pointerMove);
        window.removeEventListener('mouseup', pointerUp);
        canvas.removeEventListener('touchstart', pointerDown);
        canvas.removeEventListener('touchmove', pointerMove);
        canvas.removeEventListener('touchend', pointerUp);
      };
    },

    unmount(container) {
      if (this._cleanup) this._cleanup();
      this._cleanup = null;
      container.innerHTML = '';
    },
  };
})();
