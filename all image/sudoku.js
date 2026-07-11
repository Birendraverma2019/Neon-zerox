/* Sudoku — plugs into NexusGames.sudoku { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const SOLUTION = [
    [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
  ];

  function makePuzzle(holes) {
    const puzzle = SOLUTION.map(row => row.slice());
    let removed = 0;
    while (removed < holes) {
      const r = Math.floor(Math.random() * 9), c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) { puzzle[r][c] = 0; removed++; }
    }
    return puzzle;
  }

  window.NexusGames.sudoku = {
    mount(container) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <p id="sdk-status" style="font-size:13px;opacity:.75;">Fill the grid &middot; select a cell then a number</p>
        <div id="sdk-grid" style="display:grid;grid-template-columns:repeat(9,32px);grid-template-rows:repeat(9,32px);background:rgba(255,255,255,.3);gap:1px;border:2px solid rgba(255,255,255,.4);border-radius:4px;"></div>
        <div id="sdk-pad" style="display:flex;gap:6px;flex-wrap:wrap;max-width:280px;justify-content:center;"></div>
        <div style="display:flex;gap:10px;">
          <button id="sdk-check" style="padding:8px 16px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Check</button>
          <button id="sdk-restart" style="padding:8px 16px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">New Puzzle</button>
        </div>
      `;
      container.appendChild(wrap);

      const gridEl = wrap.querySelector('#sdk-grid');
      const padEl = wrap.querySelector('#sdk-pad');
      const statusEl = wrap.querySelector('#sdk-status');
      const checkBtn = wrap.querySelector('#sdk-check');
      const restartBtn = wrap.querySelector('#sdk-restart');

      let puzzle, fixed, cellEls, selected;

      function reset() {
        puzzle = makePuzzle(42);
        fixed = puzzle.map(row => row.map(v => v !== 0));
        selected = null;
        statusEl.textContent = 'Fill the grid \u00b7 select a cell then a number';
        render();
      }

      function render() {
        gridEl.innerHTML = '';
        cellEls = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) {
            const el = document.createElement('div');
            const borderR = (c === 2 || c === 5) ? '2px solid rgba(255,255,255,.4)' : 'none';
            const borderB = (r === 2 || r === 5) ? '2px solid rgba(255,255,255,.4)' : 'none';
            el.style.cssText = `width:32px;height:32px;background:#0a0e14;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:${fixed[r][c] ? '700' : '400'};color:${fixed[r][c] ? '#00e5ff' : '#fff'};cursor:pointer;border-right:${borderR};border-bottom:${borderB};`;
            el.textContent = puzzle[r][c] || '';
            el.addEventListener('click', () => {
              if (fixed[r][c]) return;
              selected = [r, c];
              highlight();
            });
            gridEl.appendChild(el);
            row.push(el);
          }
          cellEls.push(row);
        }
        highlight();
      }

      function highlight() {
        for (let r = 0; r < 9; r++)
          for (let c = 0; c < 9; c++)
            cellEls[r][c].style.background = (selected && selected[0] === r && selected[1] === c) ? 'rgba(0,229,255,.25)' : '#0a0e14';
      }

      padEl.innerHTML = '';
      for (let n = 1; n <= 9; n++) {
        const btn = document.createElement('button');
        btn.textContent = n;
        btn.style.cssText = 'width:32px;height:32px;border-radius:5px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-weight:700;cursor:pointer;';
        btn.addEventListener('click', () => {
          if (!selected) return;
          const [r, c] = selected;
          if (fixed[r][c]) return;
          puzzle[r][c] = n;
          cellEls[r][c].textContent = n;
        });
        padEl.appendChild(btn);
      }
      const clearBtn = document.createElement('button');
      clearBtn.textContent = '\u2715';
      clearBtn.style.cssText = 'width:32px;height:32px;border-radius:5px;border:1px solid rgba(255,255,255,.25);background:rgba(255,45,120,.15);color:#fff;font-weight:700;cursor:pointer;';
      clearBtn.addEventListener('click', () => {
        if (!selected) return;
        const [r, c] = selected;
        if (fixed[r][c]) return;
        puzzle[r][c] = 0;
        cellEls[r][c].textContent = '';
      });
      padEl.appendChild(clearBtn);

      checkBtn.addEventListener('click', () => {
        const correct = puzzle.every((row, r) => row.every((v, c) => v === SOLUTION[r][c]));
        statusEl.textContent = correct ? 'PERFECT! Solved \u2728' : 'Not quite right yet \u2014 keep going';
      });
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
