/* Pac-Man — plugs into NexusGames.pacMan { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  // 0 = wall, 1 = dot, 2 = empty
  const MAP = [
    '1111111111111111111',
    '1000000110000000001',
    '1011110110111101101',
    '1010000000000001101',
    '1010111111111101101',
    '1000100000001000001',
    '1111101111101111101',
    '1000001000001000001',
    '1011111011111101101',
    '1000000000000000001',
    '1111111111111111111',
  ];
  const CELL = 20;

  window.NexusGames.pacMan = {
    mount(container) {
      const rows = MAP.length, cols = MAP[0].length;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="pac-score">0</b></span></div>
        <canvas id="pac-canvas" width="${cols*CELL}" height="${rows*CELL}" style="background:#0a0e14;border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <p style="font-size:12px;opacity:.6;">Arrow keys to move &middot; eat all dots, avoid the ghost</p>
        <div id="pac-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p id="pac-msg" style="font-size:15px;"></p>
          <button id="pac-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#pac-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#pac-score');
      const overEl = wrap.querySelector('#pac-over');
      const msgEl = wrap.querySelector('#pac-msg');
      const restartBtn = wrap.querySelector('#pac-restart');

      let grid, pac, dir, nextDir, ghost, score, alive, dotsLeft, raf, lastMove, moveMs = 160, mouthPhase;

      function parseMap() {
        grid = MAP.map(row => row.split('').map(ch => (ch === '1' ? 1 : ch === '0' ? 0 : 2)));
      }

      function reset() {
        parseMap();
        pac = { x: 1, y: 1 };
        dir = { x: 0, y: 0 };
        nextDir = { x: 0, y: 0 };
        ghost = { x: cols - 2, y: rows - 2, dir: { x: -1, y: 0 } };
        score = 0;
        alive = true;
        dotsLeft = grid.flat().filter(v => v === 1).length;
        mouthPhase = 0;
        lastMove = performance.now();
        scoreEl.textContent = score;
        overEl.style.display = 'none';
        grid[pac.y][pac.x] = 2;
      }

      function walkable(x, y) {
        return y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] !== 0;
      }

      function moveGhost() {
        const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        const options = dirs.filter(d => walkable(ghost.x + d.x, ghost.y + d.y) && !(d.x === -ghost.dir.x && d.y === -ghost.dir.y));
        let best = options.length ? options : dirs.filter(d => walkable(ghost.x + d.x, ghost.y + d.y));
        best.sort((a, b) => {
          const da = Math.hypot(ghost.x + a.x - pac.x, ghost.y + a.y - pac.y);
          const db = Math.hypot(ghost.x + b.x - pac.x, ghost.y + b.y - pac.y);
          return da - db;
        });
        if (best.length) {
          ghost.dir = Math.random() < 0.7 ? best[0] : best[Math.floor(Math.random()*best.length)];
          ghost.x += ghost.dir.x;
          ghost.y += ghost.dir.y;
        }
      }

      function step() {
        if (walkable(pac.x + nextDir.x, pac.y + nextDir.y)) dir = nextDir;
        if (walkable(pac.x + dir.x, pac.y + dir.y)) {
          pac.x += dir.x;
          pac.y += dir.y;
        }
        if (grid[pac.y][pac.x] === 1) {
          grid[pac.y][pac.x] = 2;
          score += 10;
          dotsLeft--;
          scoreEl.textContent = score;
          if (dotsLeft === 0) {
            alive = false;
            msgEl.textContent = 'YOU CLEARED THE MAZE! \uD83C\uDF89';
            overEl.style.display = 'flex';
          }
        }
        moveGhost();
        if (ghost.x === pac.x && ghost.y === pac.y) {
          alive = false;
          msgEl.textContent = 'CAUGHT BY THE GHOST';
          overEl.style.display = 'flex';
        }
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) {
            if (grid[y][x] === 0) {
              ctx.fillStyle = 'rgba(0,229,255,.25)';
              ctx.fillRect(x*CELL, y*CELL, CELL, CELL);
            } else if (grid[y][x] === 1) {
              ctx.fillStyle = '#ffd60a';
              ctx.beginPath();
              ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, 2.5, 0, Math.PI*2);
              ctx.fill();
            }
          }

        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        const mouth = (Math.sin(mouthPhase) + 1) * 0.15 + 0.05;
        const angle = dir.x === -1 ? Math.PI : dir.y === -1 ? -Math.PI/2 : dir.y === 1 ? Math.PI/2 : 0;
        ctx.arc(pac.x*CELL+CELL/2, pac.y*CELL+CELL/2, CELL/2-2, angle+mouth*Math.PI, angle+(2-mouth)*Math.PI);
        ctx.lineTo(pac.x*CELL+CELL/2, pac.y*CELL+CELL/2);
        ctx.fill();

        ctx.fillStyle = '#ff2d78';
        ctx.beginPath();
        ctx.arc(ghost.x*CELL+CELL/2, ghost.y*CELL+CELL/2, CELL/2-2, Math.PI, 0);
        ctx.lineTo(ghost.x*CELL+CELL-2, ghost.y*CELL+CELL-2);
        ctx.lineTo(ghost.x*CELL+2, ghost.y*CELL+CELL-2);
        ctx.fill();
      }

      function loop(now) {
        if (alive) {
          mouthPhase += 0.3;
          if (now - lastMove >= moveMs) {
            lastMove = now;
            step();
          }
          draw();
          raf = requestAnimationFrame(loop);
        }
      }

      function onKey(e) {
        const map = { ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1}, ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0} };
        if (map[e.key]) { nextDir = map[e.key]; e.preventDefault(); }
      }

      restartBtn.addEventListener('click', () => { reset(); raf = requestAnimationFrame(loop); });
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
