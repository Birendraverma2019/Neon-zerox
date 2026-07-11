/* Candy Crush — plugs into NexusGames.candyCrush { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const CANDIES = ['\uD83C\uDF6D', '\uD83C\uDF6C', '\uD83C\uDF67', '\uD83C\uDF53', '\uD83D\uDC99', '\uD83D\uDFE1'];

  window.NexusGames.candyCrush = {
    mount(container) {
      const SIZE = 8;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;letter-spacing:.05em;opacity:.85;">
          <span>SCORE: <b id="cc-score">0</b></span>
          <span>MOVES: <b id="cc-moves">20</b></span>
        </div>
        <div id="cc-grid" style="display:grid;grid-template-columns:repeat(${SIZE},36px);grid-template-rows:repeat(${SIZE},36px);gap:3px;background:rgba(255,255,255,.06);padding:6px;border-radius:8px;"></div>
        <p style="font-size:12px;opacity:.6;">Click two adjacent candies to swap</p>
        <div id="cc-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">OUT OF MOVES</p>
          <button id="cc-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const gridEl = wrap.querySelector('#cc-grid');
      const scoreEl = wrap.querySelector('#cc-score');
      const movesEl = wrap.querySelector('#cc-moves');
      const overEl = wrap.querySelector('#cc-over');
      const restartBtn = wrap.querySelector('#cc-restart');

      let board, cellEls, score, moves, selected, busy;

      function randCandy() { return Math.floor(Math.random() * CANDIES.length); }

      function buildBoard() {
        board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, randCandy));
        // remove initial matches
        let matches;
        do {
          matches = findMatches();
          matches.forEach(([r, c]) => { board[r][c] = randCandy(); });
        } while (matches.length);
      }

      function findMatches() {
        const matched = [];
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE - 2; c++)
            if (board[r][c] !== -1 && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2])
              matched.push([r,c],[r,c+1],[r,c+2]);
        for (let c = 0; c < SIZE; c++)
          for (let r = 0; r < SIZE - 2; r++)
            if (board[r][c] !== -1 && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c])
              matched.push([r,c],[r+1,c],[r+2,c]);
        const uniq = Array.from(new Set(matched.map(p => p.join(',')))).map(s => s.split(',').map(Number));
        return uniq;
      }

      function collapse() {
        for (let c = 0; c < SIZE; c++) {
          let write = SIZE - 1;
          for (let r = SIZE - 1; r >= 0; r--) {
            if (board[r][c] !== -1) {
              board[write][c] = board[r][c];
              write--;
            }
          }
          for (let r = write; r >= 0; r--) board[r][c] = randCandy();
        }
      }

      function render() {
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++) {
            const el = cellEls[r][c];
            el.textContent = CANDIES[board[r][c]] || '';
            const isSel = selected && selected[0] === r && selected[1] === c;
            el.style.background = isSel ? 'rgba(0,229,255,.35)' : 'rgba(255,255,255,.05)';
          }
        scoreEl.textContent = score;
        movesEl.textContent = moves;
      }

      async function resolveMatches() {
        let matches = findMatches();
        while (matches.length) {
          score += matches.length * 10;
          matches.forEach(([r, c]) => { board[r][c] = -1; });
          render();
          await sleep(150);
          collapse();
          render();
          await sleep(150);
          matches = findMatches();
        }
      }

      function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

      function isAdjacent(a, b) {
        return (Math.abs(a[0]-b[0]) === 1 && a[1] === b[1]) || (Math.abs(a[1]-b[1]) === 1 && a[0] === b[0]);
      }

      function swap(a, b) {
        const tmp = board[a[0]][a[1]];
        board[a[0]][a[1]] = board[b[0]][b[1]];
        board[b[0]][b[1]] = tmp;
      }

      async function onCellClick(r, c) {
        if (busy || moves <= 0) return;
        if (!selected) { selected = [r, c]; render(); return; }
        if (selected[0] === r && selected[1] === c) { selected = null; render(); return; }
        if (!isAdjacent(selected, [r, c])) { selected = [r, c]; render(); return; }

        busy = true;
        const a = selected, b = [r, c];
        swap(a, b);
        const matches = findMatches();
        if (!matches.length) {
          await sleep(120);
          swap(a, b); // revert
          selected = null;
          render();
          busy = false;
          return;
        }
        moves--;
        selected = null;
        render();
        await resolveMatches();
        busy = false;
        if (moves <= 0) overEl.style.display = 'flex';
      }

      function reset() {
        buildBoard();
        score = 0;
        moves = 20;
        selected = null;
        busy = false;
        overEl.style.display = 'none';
        render();
      }

      gridEl.innerHTML = '';
      cellEls = [];
      for (let r = 0; r < SIZE; r++) {
        const row = [];
        for (let c = 0; c < SIZE; c++) {
          const el = document.createElement('div');
          el.style.cssText = 'width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;border-radius:5px;cursor:pointer;';
          el.addEventListener('click', () => onCellClick(r, c));
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
