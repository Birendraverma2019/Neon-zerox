/* ==================================================================
   NEXUS ARCADE — Tic Tac Toe Cartridge
   Registers itself on window.NexusGames.ticTacToe per the contract
   in script.js:

     window.NexusGames.ticTacToe = {
       mount(container)   -> called when the game should start
       unmount(container) -> called when the stage is closed
     }

   File location expected by GAME_REGISTRY: games/tic-tac-toe.js
   ================================================================== */

(() => {
  'use strict';

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  /* ----------------------------------------------------------------
     Scoped styles — reuses the portal's existing design tokens
     (--neon-cyan, --neon-magenta, --font-display, --glass-border,
     --radius-md, --ease-out, --text-dim, etc. from style.css) so the
     cartridge feels native rather than bolted on.
     ---------------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('ttt-styles')) return;
    const style = document.createElement('style');
    style.id = 'ttt-styles';
    style.textContent = `
      .ttt {
        width: min(400px, 100%);
        margin: 0 auto;
        font-family: var(--font-body);
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .ttt__eyebrow {
        font-family: var(--font-display);
        font-size: 11px;
        letter-spacing: 0.16em;
        color: var(--text-dim);
        text-align: center;
        margin: 0 0 4px;
      }

      /* mode / difficulty select */
      .ttt__choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .ttt__choice-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 18px 10px;
        background: var(--glass-fill);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        transition: border-color 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out), transform 0.15s var(--ease-out);
      }
      .ttt__choice-btn:hover, .ttt__choice-btn:focus-visible {
        border-color: var(--glass-border-hover);
        box-shadow: var(--glow-cyan);
        outline: none;
      }
      .ttt__choice-btn:active { transform: scale(0.97); }
      .ttt__choice-icon { font-size: 22px; line-height: 1; }
      .ttt__choice-title { font-family: var(--font-display); font-size: 12.5px; letter-spacing: 0.05em; }
      .ttt__choice-sub { font-size: 11.5px; color: var(--text-dim); }

      .ttt__back {
        align-self: flex-start;
        background: none;
        border: none;
        color: var(--text-dim);
        font-family: var(--font-body);
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 2px 0;
      }
      .ttt__back:hover { color: var(--text-primary); }

      /* scoreboard */
      .ttt__scores { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; }
      .ttt__score-card {
        background: var(--glass-fill);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        padding: 8px 10px;
        text-align: center;
        transition: border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
      }
      .ttt__score-card.active-x { border-color: var(--neon-cyan); box-shadow: var(--glow-cyan); }
      .ttt__score-card.active-o { border-color: var(--neon-magenta); box-shadow: var(--glow-magenta); }
      .ttt__score-label {
        font-family: var(--font-display);
        font-size: 9.5px;
        letter-spacing: 0.08em;
        color: var(--text-faint);
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .ttt__score-val { font-family: var(--font-display); font-size: 20px; font-weight: 700; line-height: 1; }
      .ttt__score-val.x { color: var(--neon-cyan); }
      .ttt__score-val.o { color: var(--neon-magenta); }
      .ttt__score-val.d { color: var(--text-dim); }
      .ttt__score-mid { display: flex; align-items: center; justify-content: center; }
      .ttt__score-mid span { font-size: 10.5px; color: var(--text-dim); text-align: center; }

      /* status pill */
      .ttt__status-wrap { text-align: center; height: 28px; display: flex; align-items: center; justify-content: center; }
      .ttt__status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--glass-fill);
        border: 1px solid var(--glass-border);
        border-radius: 999px;
        padding: 5px 14px;
        font-size: 13px;
        transition: all 0.2s var(--ease-out);
      }
      .ttt__status-pill .ttt__dot { width: 7px; height: 7px; border-radius: 50%; }
      .ttt__status-pill.turn-x .ttt__dot { background: var(--neon-cyan); box-shadow: var(--glow-cyan); }
      .ttt__status-pill.turn-o .ttt__dot { background: var(--neon-magenta); box-shadow: var(--glow-magenta); }
      .ttt__status-pill.win-x { border-color: var(--neon-cyan); box-shadow: var(--glow-cyan); }
      .ttt__status-pill.win-o { border-color: var(--neon-magenta); box-shadow: var(--glow-magenta); }
      .ttt__status-pill.draw  { border-color: var(--text-faint); }
      .ttt__status-pill.thinking .ttt__dot { background: var(--text-dim); animation: ttt-pulse 1s ease-in-out infinite; }
      @keyframes ttt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }

      /* board */
      .ttt__board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .ttt__cell {
        aspect-ratio: 1;
        background: var(--glass-fill);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-size: clamp(24px, 8vw, 34px);
        font-weight: 700;
        position: relative;
        overflow: hidden;
        transition: border-color 0.15s var(--ease-out), background-color 0.15s var(--ease-out);
        user-select: none;
      }
      .ttt__cell:not(.taken) { cursor: pointer; }
      .ttt__cell:not(.taken):hover { border-color: var(--glass-border-hover); }
      .ttt__cell:not(.taken):active { transform: scale(0.96); }
      .ttt__cell .ttt__mark {
        opacity: 0;
        transform: scale(0.4) rotate(-10deg);
        transition: opacity 0.18s cubic-bezier(0.34,1.56,0.64,1), transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
        display: block;
      }
      .ttt__cell.taken { cursor: default; }
      .ttt__cell.taken .ttt__mark { opacity: 1; transform: scale(1) rotate(0); }
      .ttt__cell.x-cell .ttt__mark { color: var(--neon-cyan); }
      .ttt__cell.o-cell .ttt__mark { color: var(--neon-magenta); }
      .ttt__cell.win-cell { animation: ttt-win-pulse 0.5s ease forwards; }
      .ttt__cell.win-cell.x-cell { background: rgba(0, 246, 255, 0.12); border-color: var(--neon-cyan); }
      .ttt__cell.win-cell.o-cell { background: rgba(255, 46, 230, 0.12); border-color: var(--neon-magenta); }
      @keyframes ttt-win-pulse {
        0% { transform: scale(1); }
        40% { transform: scale(1.06); }
        70% { transform: scale(0.97); }
        100% { transform: scale(1); }
      }

      /* actions */
      .ttt__actions { display: flex; gap: 8px; }
      .ttt__btn {
        flex: 1;
        padding: 10px;
        border-radius: var(--radius-md);
        border: 1px solid var(--glass-border);
        background: transparent;
        color: var(--text-primary);
        font-family: var(--font-body);
        font-weight: 600;
        font-size: 13.5px;
        transition: border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), transform 0.08s var(--ease-out);
      }
      .ttt__btn:hover { border-color: var(--glass-border-hover); box-shadow: var(--glow-cyan); }
      .ttt__btn:active { transform: scale(0.97); }
      .ttt__btn.primary {
        border-color: var(--neon-magenta);
        color: var(--neon-magenta);
      }
      .ttt__btn.primary:hover { background: var(--neon-magenta); color: var(--bg-void); box-shadow: var(--glow-magenta); }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------------
     Game logic helpers
     ---------------------------------------------------------------- */
  function checkResult(board) {
    for (const [a, b, c] of WINS) {
      if (board[a] && board[a] === board[b] && board[b] === board[c]) {
        return { winner: board[a], combo: [a, b, c] };
      }
    }
    if (board.every((v) => v)) return { winner: 'D' };
    return null;
  }

  function findImmediateMove(board, player) {
    for (const [a, b, c] of WINS) {
      const line = [a, b, c];
      const vals = line.map((i) => board[i]);
      if (vals.filter((v) => v === player).length === 2 && vals.includes(null)) {
        return line[vals.indexOf(null)];
      }
    }
    return null;
  }

  function minimax(board, depth, isMaximizing, alpha, beta) {
    const result = checkResult(board);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      return 0;
    }
    const empty = board.reduce((acc, v, i) => (v ? acc : (acc.push(i), acc)), []);
    if (isMaximizing) {
      let best = -Infinity;
      for (const i of empty) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const i of empty) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true, alpha, beta));
        board[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function pickBotMove(board, difficulty) {
    const empty = board.reduce((acc, v, i) => (v ? acc : (acc.push(i), acc)), []);
    if (!empty.length) return null;

    if (difficulty === 'easy') {
      const winMove = findImmediateMove(board, 'O');
      if (winMove != null) return winMove;
      if (Math.random() < 0.5) {
        const blockMove = findImmediateMove(board, 'X');
        if (blockMove != null) return blockMove;
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }

    let bestScore = -Infinity;
    let bestMove = empty[0];
    for (const i of empty) {
      board[i] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  }

  /* ----------------------------------------------------------------
     UI builder — screens: mode select -> (difficulty select) -> board
     ---------------------------------------------------------------- */
  function buildGame(container) {
    const root = document.createElement('div');
    root.className = 'ttt';
    container.appendChild(root);

    let timeouts = [];
    function later(fn, ms) { const t = setTimeout(fn, ms); timeouts.push(t); return t; }
    function clearTimers() { timeouts.forEach(clearTimeout); timeouts = []; }

    showModeSelect();

    function showModeSelect() {
      clearTimers();
      root.innerHTML = `
        <p class="ttt__eyebrow">// SELECT MODE</p>
        <div class="ttt__choice-grid">
          <button class="ttt__choice-btn" data-mode="friend" type="button">
            <span class="ttt__choice-icon">🤝</span>
            <span class="ttt__choice-title">VS FRIEND</span>
            <span class="ttt__choice-sub">Local 2-player</span>
          </button>
          <button class="ttt__choice-btn" data-mode="bot" type="button">
            <span class="ttt__choice-icon">🤖</span>
            <span class="ttt__choice-title">VS BOT</span>
            <span class="ttt__choice-sub">Challenge NEXUS-AI</span>
          </button>
        </div>
      `;
      root.querySelector('[data-mode="friend"]').addEventListener('click', () => startBoard('friend'));
      root.querySelector('[data-mode="bot"]').addEventListener('click', showDifficultySelect);
    }

    function showDifficultySelect() {
      root.innerHTML = `
        <button class="ttt__back" type="button" data-back>&larr; Back</button>
        <p class="ttt__eyebrow">// SELECT DIFFICULTY</p>
        <div class="ttt__choice-grid">
          <button class="ttt__choice-btn" data-diff="easy" type="button">
            <span class="ttt__choice-icon">◐</span>
            <span class="ttt__choice-title">EASY</span>
            <span class="ttt__choice-sub">Bot plays loose</span>
          </button>
          <button class="ttt__choice-btn" data-diff="unbeatable" type="button">
            <span class="ttt__choice-icon">◆</span>
            <span class="ttt__choice-title">UNBEATABLE</span>
            <span class="ttt__choice-sub">Perfect play</span>
          </button>
        </div>
      `;
      root.querySelector('[data-back]').addEventListener('click', showModeSelect);
      root.querySelectorAll('[data-diff]').forEach((btn) => {
        btn.addEventListener('click', () => startBoard('bot', btn.dataset.diff));
      });
    }

    function startBoard(mode, difficulty) {
      const isBot = mode === 'bot';

      root.innerHTML = `
        <button class="ttt__back" type="button" data-back>&larr; Change mode</button>

        <div class="ttt__scores">
          <div class="ttt__score-card" id="tttCardX">
            <div class="ttt__score-label">${isBot ? 'YOU (X)' : 'PLAYER X'}</div>
            <div class="ttt__score-val x" id="tttScoreX">0</div>
          </div>
          <div class="ttt__score-mid">
            <span>DRAW<br><span class="ttt__score-val d" id="tttScoreD" style="font-size:14px">0</span></span>
          </div>
          <div class="ttt__score-card" id="tttCardO">
            <div class="ttt__score-label">${isBot ? 'NEXUS-AI (O)' : 'PLAYER O'}</div>
            <div class="ttt__score-val o" id="tttScoreO">0</div>
          </div>
        </div>

        <div class="ttt__status-wrap">
          <div class="ttt__status-pill turn-x" id="tttStatusPill">
            <span class="ttt__dot"></span>
            <span id="tttStatusText">X's turn</span>
          </div>
        </div>

        <div class="ttt__board" id="tttBoard">
          ${Array.from({ length: 9 }, (_, i) => `<div class="ttt__cell" data-i="${i}"><span class="ttt__mark"></span></div>`).join('')}
        </div>

        <div class="ttt__actions">
          <button class="ttt__btn" type="button" data-reset-scores>Reset Score</button>
          <button class="ttt__btn primary" type="button" data-new-game>New Game &#9654;</button>
        </div>
      `;

      root.querySelector('[data-back]').addEventListener('click', () => {
        clearTimers();
        showModeSelect();
      });

      let board = Array(9).fill(null);
      let current = 'X';
      let over = false;
      let scores = { X: 0, O: 0, D: 0 };
      let lock = false;

      const cellEls = Array.from(root.querySelectorAll('.ttt__cell'));
      const pill = root.querySelector('#tttStatusPill');
      const pillText = root.querySelector('#tttStatusText');
      const cardX = root.querySelector('#tttCardX');
      const cardO = root.querySelector('#tttCardO');
      const sX = root.querySelector('#tttScoreX');
      const sO = root.querySelector('#tttScoreO');
      const sD = root.querySelector('#tttScoreD');
      const boardEl = root.querySelector('#tttBoard');

      boardEl.addEventListener('click', (e) => {
        const cellEl = e.target.closest('.ttt__cell');
        if (!cellEl || over || lock) return;
        const i = +cellEl.dataset.i;
        if (board[i]) return;
        if (isBot && current !== 'X') return;
        play(i, cellEl);
      });

      root.querySelector('[data-new-game]').addEventListener('click', newRound);
      root.querySelector('[data-reset-scores]').addEventListener('click', () => {
        scores = { X: 0, O: 0, D: 0 };
        sX.textContent = sO.textContent = sD.textContent = '0';
        newRound();
      });

      cardX.classList.add('active-x');

      function play(i, cellEl) {
        board[i] = current;
        cellEl.classList.add('taken', current.toLowerCase() + '-cell');
        cellEl.querySelector('.ttt__mark').textContent = current;

        const result = checkResult(board);
        if (result) {
          over = true;
          if (result.winner === 'D') {
            setStatus('draw', 'Draw. Reset the grid.');
            scores.D++; sD.textContent = scores.D;
          } else {
            const label = isBot && result.winner === 'O' ? 'NEXUS-AI wins' : `${result.winner} wins`;
            setStatus('win-' + result.winner.toLowerCase(), `${label} 🎉`);
            scores[result.winner]++;
            (result.winner === 'X' ? sX : sO).textContent = scores[result.winner];
            result.combo.forEach((idx) => cellEls[idx].classList.add('win-cell'));
          }
          return;
        }

        current = current === 'X' ? 'O' : 'X';
        setStatus('turn-' + current.toLowerCase(), `${current}'s turn`);

        if (isBot && current === 'O' && !over) {
          lock = true;
          pill.classList.add('thinking');
          later(() => {
            pill.classList.remove('thinking');
            const move = pickBotMove(board, difficulty);
            lock = false;
            if (move != null && !over) play(move, cellEls[move]);
          }, 420);
        }
      }

      function setStatus(cls, text) {
        pill.className = 'ttt__status-pill ' + cls;
        pillText.textContent = text;
        cardX.className = 'ttt__score-card' + (cls === 'turn-x' || cls === 'win-x' ? ' active-x' : '');
        cardO.className = 'ttt__score-card' + (cls === 'turn-o' || cls === 'win-o' ? ' active-o' : '');
      }

      function newRound() {
        clearTimers();
        board = Array(9).fill(null);
        current = 'X';
        over = false;
        lock = false;
        cellEls.forEach((c) => {
          c.className = 'ttt__cell';
          c.querySelector('.ttt__mark').textContent = '';
        });
        setStatus('turn-x', "X's turn");
      }
    }

    return {
      destroy() {
        clearTimers();
      },
    };
  }

  /* ----------------------------------------------------------------
     Contract required by script.js
     ---------------------------------------------------------------- */
  let instance = null;

  window.NexusGames = window.NexusGames || {};
  window.NexusGames.ticTacToe = {
    mount(container) {
      injectStyles();
      instance = buildGame(container);
    },
    unmount() {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    },
  };
})();
