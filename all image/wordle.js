/* Wordle — plugs into NexusGames.wordle { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const WORDS = ['NEXUS', 'ARCADE', 'PIXEL', 'GLITCH', 'CIRCUIT', 'NEON', 'LASER', 'ROBOT', 'CYBER', 'MATRIX']
    .filter(w => w.length === 5);
  const WORD_LIST = ['NEXUS', 'PIXEL', 'NEONS', 'LASER', 'ROBOT', 'CYBER', 'GLITZ', 'CHASE', 'QUEST', 'BLAZE', 'TOWER', 'MEGAS'];

  window.NexusGames.wordle = {
    mount(container) {
      const ROWS = 6, COLS = 5;
      const answer = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div id="wdl-grid" style="display:grid;grid-template-rows:repeat(${ROWS},44px);gap:6px;"></div>
        <p id="wdl-msg" style="font-size:13px;opacity:.75;min-height:18px;"></p>
        <div id="wdl-keyboard" style="display:flex;flex-direction:column;gap:6px;align-items:center;"></div>
        <button id="wdl-restart" style="display:none;padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Play Again</button>
      `;
      container.appendChild(wrap);

      const gridEl = wrap.querySelector('#wdl-grid');
      const msgEl = wrap.querySelector('#wdl-msg');
      const kbEl = wrap.querySelector('#wdl-keyboard');
      const restartBtn = wrap.querySelector('#wdl-restart');

      let rows, currentRow, currentCol, over, tiles;
      const keyStates = {};

      function buildGrid() {
        gridEl.innerHTML = '';
        tiles = [];
        for (let r = 0; r < ROWS; r++) {
          const rowDiv = document.createElement('div');
          rowDiv.style.cssText = 'display:flex;gap:6px;';
          const rowTiles = [];
          for (let c = 0; c < COLS; c++) {
            const tile = document.createElement('div');
            tile.style.cssText = 'width:44px;height:44px;border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;border-radius:4px;text-transform:uppercase;';
            rowDiv.appendChild(tile);
            rowTiles.push(tile);
          }
          gridEl.appendChild(rowDiv);
          tiles.push(rowTiles);
        }
      }

      function buildKeyboard() {
        const rowsLayout = ['QWERTYUIOP', 'ASDFGHJKL', 'ENTERZXCVBNMBACK'];
        kbEl.innerHTML = '';
        ['QWERTYUIOP', 'ASDFGHJKL'].forEach(rowStr => {
          const rowDiv = document.createElement('div');
          rowDiv.style.cssText = 'display:flex;gap:4px;';
          rowStr.split('').forEach(ch => rowDiv.appendChild(makeKey(ch, ch)));
          kbEl.appendChild(rowDiv);
        });
        const lastRow = document.createElement('div');
        lastRow.style.cssText = 'display:flex;gap:4px;';
        lastRow.appendChild(makeKey('ENTER', 'ENTER', 52));
        'ZXCVBNM'.split('').forEach(ch => lastRow.appendChild(makeKey(ch, ch)));
        lastRow.appendChild(makeKey('BACK', '\u232B', 52));
        kbEl.appendChild(lastRow);
      }

      function makeKey(key, label, width) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.key = key;
        btn.style.cssText = `min-width:${width || 30}px;padding:10px 6px;border-radius:5px;border:none;background:rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:700;cursor:pointer;`;
        btn.addEventListener('click', () => handleKey(key));
        return btn;
      }

      function reset() {
        rows = Array.from({ length: ROWS }, () => '');
        currentRow = 0;
        currentCol = 0;
        over = false;
        Object.keys(keyStates).forEach(k => delete keyStates[k]);
        msgEl.textContent = '';
        restartBtn.style.display = 'none';
        buildGrid();
        buildKeyboard();
      }

      function flash(msg) {
        msgEl.textContent = msg;
        setTimeout(() => { if (!over) msgEl.textContent = ''; }, 1200);
      }

      function handleKey(key) {
        if (over) return;
        if (key === 'BACK') {
          if (currentCol > 0) {
            currentCol--;
            tiles[currentRow][currentCol].textContent = '';
          }
          return;
        }
        if (key === 'ENTER') {
          if (currentCol !== COLS) { flash('Not enough letters'); return; }
          submitRow();
          return;
        }
        if (currentCol < COLS) {
          tiles[currentRow][currentCol].textContent = key;
          currentCol++;
        }
      }

      function submitRow() {
        const guess = tiles[currentRow].map(t => t.textContent).join('');
        const answerArr = answer.split('');
        const result = Array(COLS).fill('absent');
        const used = Array(COLS).fill(false);

        for (let i = 0; i < COLS; i++) {
          if (guess[i] === answerArr[i]) { result[i] = 'correct'; used[i] = true; }
        }
        for (let i = 0; i < COLS; i++) {
          if (result[i] === 'correct') continue;
          const idx = answerArr.findIndex((ch, j) => ch === guess[i] && !used[j]);
          if (idx !== -1) { result[i] = 'present'; used[idx] = true; }
        }

        const colors = { correct: '#39ff14', present: '#ffd60a', absent: 'rgba(255,255,255,.15)' };
        result.forEach((res, i) => {
          tiles[currentRow][i].style.background = colors[res];
          tiles[currentRow][i].style.borderColor = colors[res];
          tiles[currentRow][i].style.color = res === 'absent' ? '#fff' : '#0a0e14';
          const ch = guess[i];
          const rank = { absent: 0, present: 1, correct: 2 };
          if (!keyStates[ch] || rank[res] > rank[keyStates[ch]]) keyStates[ch] = res;
        });

        kbEl.querySelectorAll('button').forEach(btn => {
          const st = keyStates[btn.dataset.key];
          if (st) btn.style.background = colors[st];
        });

        if (guess === answer) {
          over = true;
          msgEl.textContent = 'GREAT! YOU GOT IT \u2728';
          restartBtn.style.display = 'inline-block';
          return;
        }
        currentRow++;
        currentCol = 0;
        if (currentRow === ROWS) {
          over = true;
          msgEl.textContent = `Word was ${answer}`;
          restartBtn.style.display = 'inline-block';
        }
      }

      function onKey(e) {
        if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
        else if (e.key === 'Enter') handleKey('ENTER');
        else if (e.key === 'Backspace') handleKey('BACK');
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
