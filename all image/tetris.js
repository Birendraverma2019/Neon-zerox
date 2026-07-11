/* Tetris — plugs into NexusGames.tetris { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const COLS = 10, ROWS = 18, CELL = 22;
  const SHAPES = {
    I: { blocks: [[0,0],[1,0],[2,0],[3,0]], color: '#00e5ff' },
    O: { blocks: [[0,0],[1,0],[0,1],[1,1]], color: '#ffd60a' },
    T: { blocks: [[0,0],[1,0],[2,0],[1,1]], color: '#ff2d78' },
    S: { blocks: [[1,0],[2,0],[0,1],[1,1]], color: '#39ff14' },
    Z: { blocks: [[0,0],[1,0],[1,1],[2,1]], color: '#ff5c9a' },
    J: { blocks: [[0,0],[0,1],[1,1],[2,1]], color: '#5c7cff' },
    L: { blocks: [[2,0],[0,1],[1,1],[2,1]], color: '#ffb703' },
  };
  const KEYS = Object.keys(SHAPES);

  window.NexusGames.tetris = {
    mount(container) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:20px;align-items:flex-start;justify-content:center;color:#fff;font-family:inherit;flex-wrap:wrap;';
      wrap.innerHTML = `
        <canvas id="trs-canvas" width="${COLS * CELL}" height="${ROWS * CELL}" style="background:#0a0e14;border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <div style="display:flex;flex-direction:column;gap:14px;min-width:120px;">
          <div><p style="opacity:.6;font-size:12px;">SCORE</p><p id="trs-score" style="font-size:22px;font-weight:700;">0</p></div>
          <div><p style="opacity:.6;font-size:12px;">LINES</p><p id="trs-lines" style="font-size:22px;font-weight:700;">0</p></div>
          <p style="font-size:12px;opacity:.6;line-height:1.6;">&larr;&rarr; move<br>&uarr; rotate<br>&darr; soft drop<br>Space hard drop</p>
          <div id="trs-over" style="display:none;flex-direction:column;gap:8px;">
            <p style="font-size:14px;">GAME OVER</p>
            <button id="trs-restart" style="padding:8px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
          </div>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#trs-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#trs-score');
      const linesEl = wrap.querySelector('#trs-lines');
      const overEl = wrap.querySelector('#trs-over');
      const restartBtn = wrap.querySelector('#trs-restart');

      let grid, current, score, lines, alive, dropMs, lastDrop, raf;

      function newPiece() {
        const key = KEYS[Math.floor(Math.random() * KEYS.length)];
        const shape = SHAPES[key];
        return { blocks: shape.blocks.map(([x, y]) => ({ x: x + 3, y })), color: shape.color, key };
      }

      function reset() {
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        current = newPiece();
        score = 0;
        lines = 0;
        alive = true;
        dropMs = 550;
        lastDrop = performance.now();
        scoreEl.textContent = score;
        linesEl.textContent = lines;
        overEl.style.display = 'none';
      }

      function collides(blocks) {
        return blocks.some(({ x, y }) =>
          x < 0 || x >= COLS || y >= ROWS || (y >= 0 && grid[y][x]));
      }

      function lockPiece() {
        current.blocks.forEach(({ x, y }) => {
          if (y >= 0) grid[y][x] = current.color;
        });
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (grid[r].every(cell => cell)) {
            grid.splice(r, 1);
            grid.unshift(Array(COLS).fill(null));
            cleared++;
            r++;
          }
        }
        if (cleared) {
          score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
          lines += cleared;
          dropMs = Math.max(120, 550 - lines * 15);
          scoreEl.textContent = score;
          linesEl.textContent = lines;
        }
        current = newPiece();
        if (collides(current.blocks)) {
          alive = false;
          overEl.style.display = 'flex';
        }
      }

      function move(dx, dy) {
        const moved = current.blocks.map(b => ({ x: b.x + dx, y: b.y + dy }));
        if (!collides(moved)) {
          current.blocks = moved;
          return true;
        }
        if (dy > 0) lockPiece();
        return false;
      }

      function rotate() {
        const pivot = current.blocks[1] || current.blocks[0];
        const rotated = current.blocks.map(({ x, y }) => ({
          x: pivot.x - (y - pivot.y),
          y: pivot.y + (x - pivot.x),
        }));
        if (!collides(rotated)) current.blocks = rotated;
      }

      function hardDrop() {
        while (move(0, 1)) {}
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (grid[r][c]) {
              ctx.fillStyle = grid[r][c];
              ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            }

        ctx.fillStyle = current.color;
        current.blocks.forEach(({ x, y }) => {
          if (y >= 0) ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        });

        ctx.strokeStyle = 'rgba(255,255,255,.05)';
        for (let c = 0; c <= COLS; c++) {
          ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
        }
      }

      function loop(now) {
        if (alive) {
          if (now - lastDrop >= dropMs) {
            lastDrop = now;
            move(0, 1);
          }
          draw();
          raf = requestAnimationFrame(loop);
        }
      }

      function onKey(e) {
        if (!alive) return;
        if (e.key === 'ArrowLeft') move(-1, 0);
        else if (e.key === 'ArrowRight') move(1, 0);
        else if (e.key === 'ArrowDown') move(0, 1);
        else if (e.key === 'ArrowUp') rotate();
        else if (e.key === ' ') hardDrop();
        else return;
        e.preventDefault();
        draw();
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
