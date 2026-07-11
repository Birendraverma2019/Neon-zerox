/* Fruit Ninja — plugs into NexusGames.fruitNinja { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const FRUITS = [
    { emoji: '\uD83C\uDF49', r: 18 }, { emoji: '\uD83C\uDF4A', r: 16 }, { emoji: '\uD83C\uDF4B', r: 16 },
    { emoji: '\uD83C\uDF47', r: 15 }, { emoji: '\uD83C\uDF53', r: 14 }, { emoji: '\uD83C\uDF4D', r: 20 },
  ];
  const BOMB = { emoji: '\uD83D\uDCA3', r: 17 };

  window.NexusGames.fruitNinja = {
    mount(container) {
      const W = 480, H = 420;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="fn-score">0</b></span><span>LIVES: <b id="fn-lives">3</b></span></div>
        <canvas id="fn-canvas" width="${W}" height="${H}" style="background:linear-gradient(180deg,#0a0e14,#141a24);border:1px solid rgba(255,255,255,.15);border-radius:8px;touch-action:none;cursor:crosshair;"></canvas>
        <p style="font-size:12px;opacity:.6;">Drag across fruit to slice &middot; avoid bombs \uD83D\uDCA3</p>
        <div id="fn-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">GAME OVER</p>
          <button id="fn-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#fn-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#fn-score');
      const livesEl = wrap.querySelector('#fn-lives');
      const overEl = wrap.querySelector('#fn-over');
      const restartBtn = wrap.querySelector('#fn-restart');

      let items, score, lives, alive, raf, spawnTimer, dragging, trail;

      function reset() {
        items = [];
        score = 0;
        lives = 3;
        alive = true;
        spawnTimer = 0;
        trail = [];
        scoreEl.textContent = score;
        livesEl.textContent = lives;
        overEl.style.display = 'none';
      }

      function spawn() {
        const isBomb = Math.random() < 0.15;
        const kind = isBomb ? BOMB : FRUITS[Math.floor(Math.random() * FRUITS.length)];
        items.push({
          x: 40 + Math.random() * (W - 80),
          y: H + 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -(9 + Math.random() * 3),
          gravity: 0.22,
          r: kind.r,
          emoji: kind.emoji,
          bomb: isBomb,
          sliced: false,
          rot: 0,
          vrot: (Math.random() - 0.5) * 0.1,
        });
      }

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: (t.clientX - rect.left) * (W / rect.width), y: (t.clientY - rect.top) * (H / rect.height) };
      }

      function pointerDown(e) { dragging = true; trail = [getPos(e)]; }
      function pointerUp() { dragging = false; trail = []; }
      function pointerMove(e) {
        if (!dragging || !alive) return;
        const p = getPos(e);
        trail.push(p);
        if (trail.length > 8) trail.shift();
        if (trail.length >= 2) {
          const a = trail[trail.length - 2], b = trail[trail.length - 1];
          items.forEach(it => {
            if (it.sliced) return;
            const dist = distToSegment(it.x, it.y, a.x, a.y, b.x, b.y);
            if (dist < it.r + 6) {
              it.sliced = true;
              if (it.bomb) {
                lives--;
                livesEl.textContent = lives;
                if (lives <= 0) endGame();
              } else {
                score += 10;
                scoreEl.textContent = score;
              }
            }
          });
        }
      }

      function distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len2 = dx * dx + dy * dy || 1;
        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const cx = x1 + t * dx, cy = y1 + t * dy;
        return Math.hypot(px - cx, py - cy);
      }

      function endGame() {
        alive = false;
        overEl.style.display = 'flex';
      }

      function update() {
        spawnTimer--;
        if (spawnTimer <= 0) {
          spawn();
          spawnTimer = 45 - Math.min(25, Math.floor(score / 10));
        }
        items.forEach(it => {
          it.vy += it.gravity;
          it.x += it.vx;
          it.y += it.vy;
          it.rot += it.vrot;
        });
        // missed fruit (not bomb) falling past bottom costs a life
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (it.y > H + 60) {
            if (!it.sliced && !it.bomb) {
              lives--;
              livesEl.textContent = lives;
              if (lives <= 0) endGame();
            }
            items.splice(i, 1);
          } else if (it.sliced && it.y > H + 200) {
            items.splice(i, 1);
          }
        }
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        items.forEach(it => {
          ctx.save();
          ctx.translate(it.x, it.y);
          ctx.rotate(it.rot);
          ctx.font = `${it.r * 2}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = it.sliced ? 0.5 : 1;
          ctx.fillText(it.emoji, 0, 0);
          ctx.restore();
        });

        if (trail.length >= 2) {
          ctx.strokeStyle = 'rgba(0,229,255,.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          trail.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
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

      canvas.addEventListener('mousedown', pointerDown);
      canvas.addEventListener('mousemove', pointerMove);
      window.addEventListener('mouseup', pointerUp);
      canvas.addEventListener('touchstart', pointerDown, { passive: true });
      canvas.addEventListener('touchmove', pointerMove, { passive: true });
      canvas.addEventListener('touchend', pointerUp);

      restartBtn.addEventListener('click', () => { reset(); raf = requestAnimationFrame(loop); });

      reset();
      draw();
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
