/* =====================================================================
   TIC-TAC-TOE // NEXUS ARCADE CARTRIDGE
   Self-contained drop-in module.

   Integration: just add this AFTER script.js (or anywhere after <body>
   content exists) —

       <script src="script.js"></script>
       <script src="tic-tac-toe.js"></script>

   On load it will:
   1. Inject its own scoped styles (id="ttt-styles", only added once).
   2. Append a game card into #gameGrid (matches existing portal a11y
      fallback pattern — one card per game).
   3. Wire the card's click to open the existing #gameStage modal,
      mount the game into #gameStageBody, and clean up on close
      (via #gameStageClose, backdrop click, or Escape key).

   No other files are required. If your script.js already renders
   cards from a GAME_REGISTRY array, you can alternatively delete the
   "mountCard" call at the bottom and instead push TTT_GAME_ENTRY
   (exposed on window) into that registry — see the export at the
   bottom of this file.
   ===================================================================== */

(function () {
  'use strict';

  const GAME_ID = 'tic-tac-toe';
  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  /* --------------------------------------------------------------
     1. STYLES
     -------------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('ttt-styles')) return;
    const style = document.createElement('style');
    style.id = 'ttt-styles';
    style.textContent = `
      .ttt-card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: .65rem;
        text-align: left;
        width: 100%;
        padding: 1.1rem 1.15rem 1.25rem;
        background: linear-gradient(160deg, rgba(18,22,34,.9), rgba(10,12,20,.95));
        border: 1px solid rgba(0,255,242,.18);
        border-radius: 14px;
        color: #eafcff;
        cursor: pointer;
        font-family: 'Rajdhani', sans-serif;
        overflow: hidden;
        transition: border-color .18s ease, transform .12s ease, box-shadow .18s ease;
      }
      .ttt-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          linear-gradient(115deg, transparent 40%, rgba(0,255,242,.06) 50%, transparent 60%);
        opacity: 0;
        transition: opacity .2s ease;
        pointer-events: none;
      }
      .ttt-card:hover, .ttt-card:focus-visible {
        border-color: rgba(0,255,242,.55);
        transform: translateY(-3px);
        box-shadow: 0 10px 26px rgba(0,255,242,.08), 0 0 0 1px rgba(0,255,242,.08) inset;
        outline: none;
      }
      .ttt-card:hover::before { opacity: 1; }
      .ttt-card:active { transform: translateY(-1px) scale(.99); }

      .ttt-card__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: .5rem;
      }
      .ttt-card__glyph {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3px;
        width: 34px;
        height: 34px;
        flex: none;
      }
      .ttt-card__glyph span {
        background: rgba(0,255,242,.14);
        border: 1px solid rgba(0,255,242,.3);
        border-radius: 3px;
      }
      .ttt-card__glyph span:nth-child(2),
      .ttt-card__glyph span:nth-child(5),
      .ttt-card__glyph span:nth-child(8) {
        background: rgba(255,43,214,.14);
        border-color: rgba(255,43,214,.32);
      }
      .ttt-card__tag {
        font-family: 'Orbitron', sans-serif;
        font-size: .6rem;
        letter-spacing: .1em;
        color: #05d9e8;
        border: 1px solid rgba(0,255,242,.35);
        border-radius: 999px;
        padding: .2rem .55rem;
        white-space: nowrap;
      }
      .ttt-card__title {
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: .03em;
        color: #f4feff;
      }
      .ttt-card__desc {
        font-size: .92rem;
        line-height: 1.35;
        color: #93a4b8;
      }

      /* ---------------- In-modal game ---------------- */
      .ttt {
        --ttt-x: #05d9e8;
        --ttt-o: #ff2bd6;
        --ttt-bg: #0d0f18;
        --ttt-surface: #151826;
        --ttt-border: rgba(255,255,255,.08);
        --ttt-muted: #7d8aa0;
        width: min(420px, 100%);
        margin: 0 auto;
        font-family: 'Rajdhani', sans-serif;
        color: #eafcff;
        display: flex;
        flex-direction: column;
        gap: .85rem;
      }
      .ttt__eyebrow {
        font-family: 'Orbitron', sans-serif;
        font-size: .68rem;
        letter-spacing: .16em;
        color: var(--ttt-muted);
        text-align: center;
        margin-bottom: .6rem;
      }

      /* mode + difficulty select */
      .ttt__mode-grid, .ttt__diff-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: .7rem;
      }
      .ttt__choice-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .35rem;
        padding: 1.1rem .6rem;
        background: var(--ttt-surface);
        border: 1px solid var(--ttt-border);
        border-radius: 12px;
        color: #eafcff;
        cursor: pointer;
        font-family: 'Rajdhani', sans-serif;
        transition: border-color .15s ease, transform .1s ease, background .15s ease;
      }
      .ttt__choice-btn:hover, .ttt__choice-btn:focus-visible {
        border-color: rgba(0,255,242,.5);
        background: rgba(0,255,242,.06);
        outline: none;
      }
      .ttt__choice-btn:active { transform: scale(.97); }
      .ttt__choice-icon { font-size: 1.4rem; line-height: 1; }
      .ttt__choice-title {
        font-family: 'Orbitron', sans-serif;
        font-size: .82rem;
        letter-spacing: .04em;
      }
      .ttt__choice-sub { font-size: .74rem; color: var(--ttt-muted); }

      .ttt__back {
        align-self: flex-start;
        background: none;
        border: none;
        color: var(--ttt-muted);
        font-family: 'Rajdhani', sans-serif;
        font-size: .82rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: .3rem;
        padding: .2rem 0;
      }
      .ttt__back:hover { color: #eafcff; }

      /* scoreboard */
      .ttt__scores {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: .5rem;
      }
      .ttt__score-card {
        background: var(--ttt-surface);
        border: 1px solid var(--ttt-border);
        border-radius: 10px;
        padding: .5rem .6rem;
        text-align: center;
        transition: border-color .2s ease;
      }
      .ttt__score-card.active-x { border-color: rgba(5,217,232,.55); }
      .ttt__score-card.active-o { border-color: rgba(255,43,214,.55); }
      .ttt__score-label {
        font-family: 'Orbitron', sans-serif;
        font-size: .58rem;
        letter-spacing: .08em;
        color: var(--ttt-muted);
        text-transform: uppercase;
        margin-bottom: .1rem;
      }
      .ttt__score-val {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.3rem;
        font-weight: 700;
        line-height: 1;
      }
      .ttt__score-val.x { color: var(--ttt-x); }
      .ttt__score-val.o { color: var(--ttt-o); }
      .ttt__score-val.d { color: var(--ttt-muted); }
      .ttt__score-mid { display: flex; align-items: center; justify-content: center; }
      .ttt__score-mid span { font-size: .64rem; color: var(--ttt-muted); text-align: center; }

      /* status pill */
      .ttt__status-wrap { text-align: center; height: 28px; display: flex; align-items: center; justify-content: center; }
      .ttt__status-pill {
        display: inline-flex;
        align-items: center;
        gap: .4rem;
        background: var(--ttt-surface);
        border: 1px solid var(--ttt-border);
        border-radius: 999px;
        padding: .3rem .85rem;
        font-size: .82rem;
        transition: all .2s ease;
      }
      .ttt__status-pill .ttt__dot { width: 7px; height: 7px; border-radius: 50%; transition: background .2s ease; }
      .ttt__status-pill.turn-x .ttt__dot { background: var(--ttt-x); box-shadow: 0 0 8px var(--ttt-x); }
      .ttt__status-pill.turn-o .ttt__dot { background: var(--ttt-o); box-shadow: 0 0 8px var(--ttt-o); }
      .ttt__status-pill.win-x { border-color: rgba(5,217,232,.55); background: rgba(5,217,232,.08); }
      .ttt__status-pill.win-o { border-color: rgba(255,43,214,.55); background: rgba(255,43,214,.08); }
      .ttt__status-pill.draw  { border-color: rgba(125,138,160,.4); }
      .ttt__status-pill.thinking .ttt__dot { background: var(--ttt-muted); animation: ttt-pulse 1s ease-in-out infinite; }
      @keyframes ttt-pulse { 0%,100% { opacity: 1; } 50% { opacity: .25; } }

      /* board */
      .ttt__board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .ttt__cell {
        aspect-ratio: 1;
        background: var(--ttt-surface);
        border: 1px solid var(--ttt-border);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Orbitron', sans-serif;
        font-size: clamp(1.6rem, 8vw, 2.3rem);
        font-weight: 800;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: border-color .15s ease, background-color .15s ease;
        user-select: none;
      }
      .ttt__cell::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255,255,255,.06) 0%, transparent 70%);
        opacity: 0;
        transition: opacity .15s ease;
        border-radius: inherit;
      }
      .ttt__cell:not(.taken):hover::before { opacity: 1; }
      .ttt__cell:not(.taken):hover { border-color: rgba(255,255,255,.18); }
      .ttt__cell:not(.taken):active { transform: scale(.96); }
      .ttt__cell.locked { cursor: default; }
      .ttt__cell .ttt__mark {
        opacity: 0;
        transform: scale(.4) rotate(-10deg);
        transition: opacity .18s cubic-bezier(.34,1.56,.64,1), transform .18s cubic-bezier(.34,1.56,.64,1);
        display: block;
      }
      .ttt__cell.taken .ttt__mark { opacity: 1; transform: scale(1) rotate(0); }
      .ttt__cell.x-cell .ttt__mark { color: var(--ttt-x); }
      .ttt__cell.o-cell .ttt__mark { color: var(--ttt-o); }
      .ttt__cell.taken { cursor: default; }
      .ttt__cell.win-cell { animation: ttt-win-pulse .5s ease forwards; }
      .ttt__cell.win-cell.x-cell { background: rgba(5,217,232,.16); border-color: rgba(5,217,232,.45); }
      .ttt__cell.win-cell.o-cell { background: rgba(255,43,214,.16); border-color: rgba(255,43,214,.45); }
      @keyframes ttt-win-pulse {
        0% { transform: scale(1); }
        40% { transform: scale(1.06); }
        70% { transform: scale(.97); }
        100% { transform: scale(1); }
      }

      /* actions */
      .ttt__actions { display: flex; gap: .5rem; }
      .ttt__btn {
        flex: 1;
        padding: .6rem;
        border-radius: 10px;
        border: 1px solid var(--ttt-border);
        background: var(--ttt-surface);
        color: #eafcff;
        font-family: 'Rajdhani', sans-serif;
        font-size: .84rem;
        cursor: pointer;
        transition: background .15s ease, border-color .15s ease, transform .08s ease;
      }
      .ttt__btn:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.16); }
      .ttt__btn:active { transform: scale(.97); }
      .ttt__btn.primary {
        background: linear-gradient(135deg, var(--ttt-x), var(--ttt-o));
        border-color: transparent;
        color: #050608;
        font-weight: 600;
      }
      .ttt__btn.primary:hover { filter: brightness(1.08); }
    `;
    document.head.appendChild(style);
  }

  /* --------------------------------------------------------------
     2. CARD (rendered into #gameGrid)
     -------------------------------------------------------------- */
  function buildCardEl() {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ttt-card';
    card.setAttribute('data-game', GAME_ID);
    card.setAttribute('aria-haspopup', 'dialog');
    card.innerHTML = `
      <div class="ttt-card__top">
        <span class="ttt-card__glyph" aria-hidden="true">
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
        </span>
        <span class="ttt-card__tag">2P // VS AI</span>
      </div>
      <span class="ttt-card__title">TIC-TAC-TOE</span>
      <span class="ttt-card__desc">Classic 3&times;3 grid combat. Face NEXUS-AI or pass the stick to a friend.</span>
    `;
    card.addEventListener('click', openGame);
    return card;
  }

  function mountCard() {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;
    if (grid.querySelector(`[data-game="${GAME_ID}"]`)) return;
    grid.appendChild(buildCardEl());
  }

  /* --------------------------------------------------------------
     3. MODAL WIRING (uses existing #gameStage markup)
     -------------------------------------------------------------- */
  let activeCleanup = null;

  function openGame() {
    const stage = document.getElementById('gameStage');
    const title = document.getElementById('gameStageTitle');
    const body = document.getElementById('gameStageBody');
    if (!stage || !body) return;

    if (title) title.textContent = 'TIC-TAC-TOE';
    body.innerHTML = '';
    const { root, cleanup } = buildGameRoot();
    body.appendChild(root);
    activeCleanup = cleanup;

    stage.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeGame() {
    const stage = document.getElementById('gameStage');
    const body = document.getElementById('gameStageBody');
    if (!stage || stage.hidden) return;
    stage.hidden = true;
    document.body.style.overflow = '';
    if (typeof activeCleanup === 'function') activeCleanup();
    activeCleanup = null;
    if (body) body.innerHTML = '';
  }

  function wireModalChrome() {
    const stage = document.getElementById('gameStage');
    const closeBtn = document.getElementById('gameStageClose');
    if (closeBtn) closeBtn.addEventListener('click', closeGame);
    if (stage) {
      stage.addEventListener('click', (e) => {
        if (e.target === stage) closeGame();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeGame();
    });
  }

  /* --------------------------------------------------------------
     4. GAME (mode select -> difficulty (bot only) -> board)
     -------------------------------------------------------------- */
  function buildGameRoot() {
    const root = document.createElement('div');
    root.className = 'ttt';

    const screens = document.createElement('div');
    screens.className = 'ttt__screens';
    root.appendChild(screens);

    let timeouts = [];
    function later(fn, ms) { const t = setTimeout(fn, ms); timeouts.push(t); return t; }
    function cleanup() { timeouts.forEach(clearTimeout); timeouts = []; }

    showModeSelect();

    /* ---------- Screen: choose mode ---------- */
    function showModeSelect() {
      screens.innerHTML = `
        <p class="ttt__eyebrow">// SELECT MODE</p>
        <div class="ttt__mode-grid">
          <button class="ttt__choice-btn" data-mode="friend">
            <span class="ttt__choice-icon">🤝</span>
            <span class="ttt__choice-title">VS FRIEND</span>
            <span class="ttt__choice-sub">Local 2-player</span>
          </button>
          <button class="ttt__choice-btn" data-mode="bot">
            <span class="ttt__choice-icon">🤖</span>
            <span class="ttt__choice-title">VS BOT</span>
            <span class="ttt__choice-sub">Challenge NEXUS-AI</span>
          </button>
        </div>
      `;
      screens.querySelector('[data-mode="friend"]').addEventListener('click', () => startBoard('friend'));
      screens.querySelector('[data-mode="bot"]').addEventListener('click', showDifficultySelect);
    }

    /* ---------- Screen: choose bot difficulty ---------- */
    function showDifficultySelect() {
      screens.innerHTML = `
        <button class="ttt__back" data-back>&larr; Back</button>
        <p class="ttt__eyebrow">// SELECT DIFFICULTY</p>
        <div class="ttt__diff-grid">
          <button class="ttt__choice-btn" data-diff="easy">
            <span class="ttt__choice-icon">◐</span>
            <span class="ttt__choice-title">EASY</span>
            <span class="ttt__choice-sub">Bot plays loose</span>
          </button>
          <button class="ttt__choice-btn" data-diff="unbeatable">
            <span class="ttt__choice-icon">◆</span>
            <span class="ttt__choice-title">UNBEATABLE</span>
            <span class="ttt__choice-sub">Perfect play</span>
          </button>
        </div>
      `;
      screens.querySelector('[data-back]').addEventListener('click', showModeSelect);
      screens.querySelectorAll('[data-diff]').forEach((btn) => {
        btn.addEventListener('click', () => startBoard('bot', btn.dataset.diff));
      });
    }

    /* ---------- Screen: the actual board ---------- */
    function startBoard(mode, difficulty) {
      const isBot = mode === 'bot';

      screens.innerHTML = `
        <button class="ttt__back" data-back>&larr; Change mode</button>

        <div class="ttt__scores">
          <div class="ttt__score-card" id="tttCardX">
            <div class="ttt__score-label">${isBot ? 'YOU (X)' : 'PLAYER X'}</div>
            <div class="ttt__score-val x" id="tttScoreX">0</div>
          </div>
          <div class="ttt__score-mid">
            <span>DRAW<br><span class="ttt__score-val d" id="tttScoreD" style="font-size:1rem">0</span></span>
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
          <button class="ttt__btn" data-reset-scores>Reset Score</button>
          <button class="ttt__btn primary" data-new-game>New Game &#9654;</button>
        </div>
      `;

      screens.querySelector('[data-back]').addEventListener('click', () => {
        cleanup();
        showModeSelect();
      });

      let board = Array(9).fill(null);
      let current = 'X';
      let over = false;
      let scores = { X: 0, O: 0, D: 0 };
      let lock = false; // true while bot is "thinking"

      const cellEls = Array.from(screens.querySelectorAll('.ttt__cell'));
      const pill = screens.querySelector('#tttStatusPill');
      const pillText = screens.querySelector('#tttStatusText');
      const cardX = screens.querySelector('#tttCardX');
      const cardO = screens.querySelector('#tttCardO');
      const sX = screens.querySelector('#tttScoreX');
      const sO = screens.querySelector('#tttScoreO');
      const sD = screens.querySelector('#tttScoreD');
      const boardEl = screens.querySelector('#tttBoard');

      boardEl.addEventListener('click', (e) => {
        const cellEl = e.target.closest('.ttt__cell');
        if (!cellEl || over || lock) return;
        const i = +cellEl.dataset.i;
        if (board[i]) return;
        if (isBot && current !== 'X') return; // human is always X
        play(i, cellEl);
      });

      screens.querySelector('[data-new-game]').addEventListener('click', newRound);
      screens.querySelector('[data-reset-scores]').addEventListener('click', () => {
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

    return { root, cleanup };
  }

  /* --------------------------------------------------------------
     5. RESULT CHECK + BOT AI
     -------------------------------------------------------------- */
  function checkResult(board) {
    for (const [a, b, c] of WINS) {
      if (board[a] && board[a] === board[b] && board[b] === board[c]) {
        return { winner: board[a], combo: [a, b, c] };
      }
    }
    if (board.every((v) => v)) return { winner: 'D' };
    return null;
  }

  function pickBotMove(board, difficulty) {
    const empty = board.reduce((acc, v, i) => (v ? acc : (acc.push(i), acc)), []);
    if (!empty.length) return null;

    if (difficulty === 'easy') {
      // Mostly random, but still blocks an immediate loss ~half the time
      // and never misses an immediate win, so it stays fun rather than dumb.
      const winMove = findImmediateMove(board, 'O');
      if (winMove != null) return winMove;
      if (Math.random() < 0.5) {
        const blockMove = findImmediateMove(board, 'X');
        if (blockMove != null) return blockMove;
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }

    // Unbeatable: full minimax with alpha-beta pruning.
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

  function findImmediateMove(board, player) {
    for (const [a, b, c] of WINS) {
      const line = [a, b, c];
      const vals = line.map((i) => board[i]);
      const emptyIdx = line[vals.indexOf(null)];
      if (vals.filter((v) => v === player).length === 2 && vals.includes(null)) {
        return emptyIdx;
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

  /* --------------------------------------------------------------
     6. BOOT
     -------------------------------------------------------------- */
  function boot() {
    injectStyles();
    mountCard();
    wireModalChrome();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Optional export, in case script.js uses a GAME_REGISTRY array
  // instead of static #gameGrid markup. Push this into it if so:
  window.TTT_GAME_ENTRY = {
    id: GAME_ID,
    title: 'Tic-Tac-Toe',
    description: 'Classic 3x3 grid combat. Face NEXUS-AI or pass the stick to a friend.',
    tag: '2P // VS AI',
    open: openGame
  };
})();
