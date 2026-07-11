/* 2048 — plugs into NexusGames.twentyFortyEight { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const COLORS = {
    0: 'rgba(255,255,255,.06)', 2: '#3a3f52', 4: '#454b66', 8: '#00e5ff',
    16: '#00c2e0', 32: '#ff2d78', 64: '#ff5c9a', 128: '#39ff14',
    256: '#2ee80f', 512: '#ffd60a', 1024: '#ffb703', 2048: '#ff006e',
  };

  window.NexusGames.twentyFortyEight = {
    mount(container) {
      const SIZE = 4;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;letter-spacing:.05em;opacity:.85;">
          <span>SCORE: <b id="t48-score">0</b></span>
          <span>BEST: <b id="t48-best">0</b></span>
        </div>
        <div id="t48-grid" style="display:grid;grid-template-columns:repeat(4,64px);grid-template-rows:repeat(4,64px);gap:8px;background:rgba(255,255,255,.08);padding:8px;border-radius:10px;"></div>
        <p style="font-size:12px;opacity:.6;">Arrow keys / WASD to slide</p>
        <div id="t48-over" style="display:none;flex-direction:column;align-items:center;gap:8px;">
          <p id="t48-msg" style="font-size:16px;">GAME OVER</p>
          <button id="t48-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const gridEl = wrap.querySelector('#t48-grid');
      const scoreEl = wrap.querySelector('#t48-score');
      const bestEl = wrap.querySelector('#t48-best');
      const overEl = wrap.querySelector('#t48-over');
      const msgEl = wrap.querySelector('#t48-msg');
      const restartBtn = wrap.querySelector('#t48-restart');

      const cells = [];
      for (let i = 0; i < SIZE * SIZE; i++) {
        const c = document.createElement('div');
        c.style.cssText = 'width:64px;height:64px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;transition:background .1s;';
        gridEl.appendChild(c);
        cells.push(c);
      }

      let best = Number(localStorage.getItem('nexus-2048-best') || 0);
      bestEl.textContent = best;

      let board, score, won;

      function emptyBoard() {
        return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
      }

      function addRandom() {
        const empties = [];
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++)
            if (board[r][c] === 0) empties.push([r, c]);
        if (!empties.length) return;
        const [r, c] = empties[Math.floor(Math.random() * empties.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
      }

      function render() {
        for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
            const v = board[r][c];
            const cell = cells[r * SIZE + c];
            cell.textContent = v || '';
            cell.style.background = COLORS[v] || '#ff006e';
            cell.style.color = v <= 4 ? 'rgba(255,255,255,.8)' : '#0a0e14';
          }
        }
        scoreEl.textContent = score;
      }

      function reset() {
        board = emptyBoard();
        score = 0;
        won = false;
        addRandom();
        addRandom();
        overEl.style.display = 'none';
        render();
      }

      function slideLine(line) {
        const nums = line.filter(v => v !== 0);
        const merged = [];
        for (let i = 0; i < nums.length; i++) {
          if (nums[i] === nums[i + 1]) {
            const val = nums[i] * 2;
            merged.push(val);
            score += val;
            if (val === 2048 && !won) won = true;
            i++;
          } else {
            merged.push(nums[i]);
          }
        }
        while (merged.length < SIZE) merged.push(0);
        return merged;
      }

      function rotateBoard(b) {
        const nb = emptyBoard();
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++)
            nb[c][SIZE - 1 - r] = b[r][c];
        return nb;
      }

      function move(dir) {
        let b = board.map(row => row.slice());
        let rotations = { up: 3, right: 2, down: 1, left: 0 }[dir];
        for (let i = 0; i < rotations; i++) b = rotateBoard(b);

        let changed = false;
        for (let r = 0; r < SIZE; r++) {
          const before = b[r].join(',');
          b[r] = slideLine(b[r]);
          if (b[r].join(',') !== before) changed = true;
        }

        for (let i = 0; i < (4 - rotations) % 4; i++) b = rotateBoard(b);

        if (changed) {
          board = b;
          addRandom();
          render();
          if (score > best) {
            best = score;
            localStorage.setItem('nexus-2048-best', String(best));
            bestEl.textContent = best;
          }
          if (won) {
            msgEl.textContent = 'YOU REACHED 2048!';
            overEl.style.display = 'flex';
          } else if (!hasMoves()) {
            msgEl.textContent = 'GAME OVER';
            overEl.style.display = 'flex';
          }
        }
      }

      function hasMoves() {
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) return true;
            if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
            if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
          }
        return false;
      }

      function onKey(e) {
        const map = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
        if (map[e.key]) {
          e.preventDefault();
          move(map[e.key]);
        }
      }

      restartBtn.addEventListener('click', reset);
      document.addEventListener('keydown', onKey);

      reset();

      this._cleanup = () => {
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
