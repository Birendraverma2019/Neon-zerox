/* Snake — plugs into NexusGames.snake { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.snake = {
    mount(container) {
      const COLS = 20, ROWS = 20, CELL = 18;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;letter-spacing:.05em;opacity:.85;">
          <span>SCORE: <b id="snk-score">0</b></span>
          <span>BEST: <b id="snk-best">0</b></span>
        </div>
        <canvas id="snk-canvas" width="${COLS * CELL}" height="${ROWS * CELL}" style="background:#0a0e14;border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <p style="font-size:12px;opacity:.6;">Arrow keys / WASD to move &middot; Space to restart</p>
        <div id="snk-over" style="display:none;flex-direction:column;align-items:center;gap:8px;">
          <p style="font-size:16px;">GAME OVER</p>
          <button id="snk-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#snk-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#snk-score');
      const bestEl = wrap.querySelector('#snk-best');
      const overEl = wrap.querySelector('#snk-over');
      const restartBtn = wrap.querySelector('#snk-restart');

      let best = Number(localStorage.getItem('nexus-snake-best') || 0);
      bestEl.textContent = best;

      let snake, dir, nextDir, food, score, alive, tickMs, lastTick, raf;

      function reset() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        dir = { x: 1, y: 0 };
        nextDir = dir;
        score = 0;
        alive = true;
        tickMs = 110;
        lastTick = performance.now();
        placeFood();
        scoreEl.textContent = score;
        overEl.style.display = 'none';
      }

      function placeFood() {
        do {
          food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        } while (snake.some(s => s.x === food.x && s.y === food.y));
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff2d78';
        ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

        snake.forEach((seg, i) => {
          ctx.fillStyle = i === 0 ? '#39ff14' : 'rgba(57,255,20,0.65)';
          ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
        });
      }

      function step() {
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
            snake.some(s => s.x === head.x && s.y === head.y)) {
          alive = false;
          if (score > best) {
            best = score;
            localStorage.setItem('nexus-snake-best', String(best));
            bestEl.textContent = best;
          }
          overEl.style.display = 'flex';
          return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          scoreEl.textContent = score;
          tickMs = Math.max(60, tickMs - 2);
          placeFood();
        } else {
          snake.pop();
        }
      }

      function loop(now) {
        if (alive) {
          if (now - lastTick >= tickMs) {
            lastTick = now;
            step();
          }
          draw();
          raf = requestAnimationFrame(loop);
        }
      }

      function onKey(e) {
        const map = {
          ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
          ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
        };
        const nd = map[e.key];
        if (nd && !(nd.x === -dir.x && nd.y === -dir.y)) {
          nextDir = nd;
          e.preventDefault();
        }
        if (e.key === ' ' && !alive) {
          reset();
          raf = requestAnimationFrame(loop);
        }
      }

      restartBtn.addEventListener('click', () => {
        reset();
        raf = requestAnimationFrame(loop);
      });
      document.addEventListener('keydown', onKey);

      reset();
      draw();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
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
