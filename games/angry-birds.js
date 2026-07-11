/* Angry Birds — plugs into NexusGames.angryBirds { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.angryBirds = {
    mount(container) {
      const W = 520, H = 340;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="ab-score">0</b></span><span>BIRDS LEFT: <b id="ab-birds">5</b></span></div>
        <canvas id="ab-canvas" width="${W}" height="${H}" style="background:linear-gradient(180deg,#0a0e14,#141a24);border:1px solid rgba(255,255,255,.15);border-radius:8px;cursor:grab;"></canvas>
        <p style="font-size:12px;opacity:.6;">Drag the bird back and release to launch &middot; knock down all pigs</p>
        <div id="ab-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p id="ab-msg" style="font-size:15px;"></p>
          <button id="ab-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#ab-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#ab-score');
      const birdsEl = wrap.querySelector('#ab-birds');
      const overEl = wrap.querySelector('#ab-over');
      const msgEl = wrap.querySelector('#ab-msg');
      const restartBtn = wrap.querySelector('#ab-restart');

      const SLING = { x: 90, y: H - 60 };
      const GROUND = H - 30;
      const GRAVITY = 0.35;

      let bird, birdsLeft, score, pigs, blocks, dragging, launched, alive, raf, aimVec;

      function makeLevel() {
        blocks = [
          { x: 380, y: GROUND - 20, w: 16, h: 40 },
          { x: 430, y: GROUND - 20, w: 16, h: 40 },
          { x: 405, y: GROUND - 48, w: 66, h: 16 },
        ];
        pigs = [
          { x: 405, y: GROUND - 65, r: 13, alive: true },
          { x: 380, y: GROUND - 30, r: 12, alive: true },
        ];
      }

      function newBird() {
        bird = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, r: 14, launched: false };
      }

      function reset() {
        makeLevel();
        newBird();
        birdsLeft = 5;
        score = 0;
        alive = true;
        dragging = false;
        aimVec = { x: 0, y: 0 };
        scoreEl.textContent = score;
        birdsEl.textContent = birdsLeft;
        overEl.style.display = 'none';
      }

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: (t.clientX - rect.left) * (W / rect.width), y: (t.clientY - rect.top) * (H / rect.height) };
      }

      function pointerDown(e) {
        if (bird.launched || !alive) return;
        const p = getPos(e);
        if (Math.hypot(p.x - bird.x, p.y - bird.y) < 30) dragging = true;
      }
      function pointerMove(e) {
        if (!dragging) return;
        const p = getPos(e);
        let dx = p.x - SLING.x, dy = p.y - SLING.y;
        const maxD = 70;
        const d = Math.hypot(dx, dy);
        if (d > maxD) { dx = dx / d * maxD; dy = dy / d * maxD; }
        bird.x = SLING.x + dx;
        bird.y = SLING.y + dy;
        aimVec = { x: dx, y: dy };
      }
      function pointerUp() {
        if (!dragging) return;
        dragging = false;
        bird.vx = -aimVec.x * 0.22;
        bird.vy = -aimVec.y * 0.22;
        bird.launched = true;
      }

      function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
        const closestX = Math.max(rx - rw/2, Math.min(cx, rx + rw/2));
        const closestY = Math.max(ry - rh/2, Math.min(cy, ry + rh/2));
        return Math.hypot(cx - closestX, cy - closestY) < r;
      }

      function update() {
        if (bird.launched) {
          bird.vy += GRAVITY;
          bird.x += bird.vx;
          bird.y += bird.vy;

          if (bird.y + bird.r > GROUND) { bird.y = GROUND - bird.r; bird.vy *= -0.3; bird.vx *= 0.7; }
          if (bird.x - bird.r < 0 || bird.x + bird.r > W) bird.vx *= -0.5;

          pigs.forEach(pig => {
            if (pig.alive && Math.hypot(bird.x - pig.x, bird.y - pig.y) < bird.r + pig.r) {
              pig.alive = false;
              score += 100;
              scoreEl.textContent = score;
            }
          });

          blocks.forEach(b => {
            if (circleRectCollide(bird.x, bird.y, bird.r, b.x, b.y, b.w, b.h)) {
              bird.vx *= -0.4;
              bird.vy *= -0.4;
            }
          });

          const settled = Math.abs(bird.vx) < 0.3 && Math.abs(bird.vy) < 0.3 && bird.y >= GROUND - bird.r - 1;
          const outOfBounds = bird.x > W + 40 || bird.x < -40;
          if (settled || outOfBounds) {
            birdsLeft--;
            birdsEl.textContent = birdsLeft;
            const remaining = pigs.filter(p => p.alive).length;
            if (remaining === 0) {
              alive = false;
              msgEl.textContent = 'ALL PIGS DOWN! \uD83C\uDF89';
              overEl.style.display = 'flex';
            } else if (birdsLeft <= 0) {
              alive = false;
              msgEl.textContent = 'OUT OF BIRDS';
              overEl.style.display = 'flex';
            } else {
              newBird();
            }
          }
        }
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(57,255,20,.15)';
        ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.strokeStyle = 'rgba(57,255,20,.4)';
        ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

        // sling
        ctx.strokeStyle = 'rgba(255,255,255,.4)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(SLING.x - 12, SLING.y + 40); ctx.lineTo(SLING.x, SLING.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(SLING.x + 12, SLING.y + 40); ctx.lineTo(SLING.x, SLING.y); ctx.stroke();

        blocks.forEach(b => {
          ctx.fillStyle = '#5c7cff';
          ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
        });

        pigs.forEach(p => {
          if (!p.alive) return;
          ctx.fillStyle = '#39ff14';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#ff2d78';
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
        ctx.fill();

        if (dragging) {
          ctx.strokeStyle = 'rgba(255,255,255,.3)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(bird.x, bird.y);
          ctx.lineTo(SLING.x - aimVec.x * 3, SLING.y - aimVec.y * 3);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      function loop() {
        update();
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
