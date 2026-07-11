/* Minesweeper — plugs into NexusGames.minesweeper { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.minesweeper = {
    mount(container) {
      const SIZE = 10, MINES = 15;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;letter-spacing:.05em;opacity:.85;">
          <span>MINES LEFT: <b id="ms-mines">${MINES}</b></span>
          <span id="ms-status">PLAYING</span>
        </div>
        <div id="ms-grid" style="display:grid;grid-template-columns:repeat(${SIZE},28px);grid-template-rows:repeat(${SIZE},28px);gap:2px;background:rgba(255,255,255,.08);padding:6px;border-radius:8px;"></div>
        <p style="font-size:12px;opacity:.6;">Click to reveal &middot; Right-click to flag</p>
        <button id="ms-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
      `;
      container.appendChild(wrap);

      const gridEl = wrap.querySelector('#ms-grid');
      const minesEl = wrap.querySelector('#ms-mines');
      const statusEl = wrap.querySelector('#ms-status');
      const restartBtn = wrap.querySelector('#ms-restart');

      let board, revealedCount, flags, gameOver, cellEls;

      function neighbors(r, c) {
        const out = [];
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push([nr, nc]);
          }
        return out;
      }

      function buildBoard() {
        board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ({
          mine: false, revealed: false, flagged: false, count: 0,
        })));
        let placed = 0;
        while (placed < MINES) {
          const r = Math.floor(Math.random() * SIZE), c = Math.floor(Math.random() * SIZE);
          if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
        }
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++)
            if (!board[r][c].mine)
              board[r][c].count = neighbors(r, c).filter(([nr, nc]) => board[nr][nc].mine).length;
      }

      function render() {
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++) {
            const cell = board[r][c];
            const el = cellEls[r][c];
            if (cell.revealed) {
              el.style.background = cell.mine ? '#ff2d78' : 'rgba(255,255,255,.04)';
              el.textContent = cell.mine ? '\u2739' : (cell.count || '');
              el.style.color = ['', '#00e5ff', '#39ff14', '#ffd60a', '#ff5c9a', '#ff2d78', '#00e5ff', '#fff', '#fff'][cell.count] || '#fff';
            } else {
              el.style.background = 'rgba(255,255,255,.12)';
              el.textContent = cell.flagged ? '\u2691' : '';
              el.style.color = '#ff2d78';
            }
          }
        minesEl.textContent = Math.max(0, MINES - flags);
      }

      function reveal(r, c) {
        const cell = board[r][c];
        if (cell.revealed || cell.flagged || gameOver) return;
        cell.revealed = true;
        revealedCount++;
        if (cell.mine) {
          gameOver = true;
          statusEl.textContent = 'BOOM!';
          for (let rr = 0; rr < SIZE; rr++)
            for (let cc = 0; cc < SIZE; cc++)
              if (board[rr][cc].mine) board[rr][cc].revealed = true;
          render();
          return;
        }
        if (cell.count === 0) {
          neighbors(r, c).forEach(([nr, nc]) => reveal(nr, nc));
        }
        if (revealedCount === SIZE * SIZE - MINES) {
          gameOver = true;
          statusEl.textContent = 'CLEARED!';
        }
        render();
      }

      function toggleFlag(r, c, e) {
        e.preventDefault();
        const cell = board[r][c];
        if (cell.revealed || gameOver) return;
        cell.flagged = !cell.flagged;
        flags += cell.flagged ? 1 : -1;
        render();
      }

      function reset() {
        buildBoard();
        revealedCount = 0;
        flags = 0;
        gameOver = false;
        statusEl.textContent = 'PLAYING';
        render();
      }

      gridEl.innerHTML = '';
      cellEls = [];
      for (let r = 0; r < SIZE; r++) {
        const row = [];
        for (let c = 0; c < SIZE; c++) {
          const el = document.createElement('div');
          el.style.cssText = 'width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border-radius:3px;cursor:pointer;user-select:none;';
          el.addEventListener('click', () => reveal(r, c));
          el.addEventListener('contextmenu', (e) => toggleFlag(r, c, e));
          gridEl.appendChild(el);
          row.push(el);
        }
        cellEls.push(row);
      }

      restartBtn.addEventListener('click', reset);
      reset();

      this._cleanup = () => {};
    },

    unmount(container) {
      if (this._cleanup) this._cleanup();
      this._cleanup = null;
      container.innerHTML = '';
    },
  };
})();
