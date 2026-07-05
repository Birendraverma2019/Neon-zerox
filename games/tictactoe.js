/* ============================================================
   TIC-TAC-TOE — SINGLE FILE JS GAME
   Everything (HTML, CSS, logic) is generated and injected by
   this script. Just include this file in a blank HTML page:

   <script src="tictactoe.js"></script>

   Modes:
     - 2 Players (local)
     - Play with Bot (Easy / Medium)
     - Play with Bot Pro (Unbeatable — Minimax)
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. INJECT CSS
     ---------------------------------------------------------- */
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --bg-1: #0f1229;
      --bg-2: #1b1f45;
      --accent-x: #4fd1ff;
      --accent-o: #ff6b9d;
      --panel: rgba(255,255,255,0.06);
      --panel-border: rgba(255,255,255,0.14);
      --text-main: #f4f6ff;
      --text-dim: #9aa2c7;
      --win-glow: #7CFC9A;
      --radius: 18px;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: radial-gradient(circle at 20% 20%, var(--bg-2), var(--bg-1) 70%);
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
      color: var(--text-main);
    }
    #ttt-root {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .ttt-card {
      width: 100%;
      max-width: 460px;
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      padding: 28px 26px 24px;
      backdrop-filter: blur(14px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.45);
      animation: ttt-fadein 0.4s ease;
    }
    @keyframes ttt-fadein {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ttt-title {
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 1px;
      margin: 0 0 4px;
      background: linear-gradient(90deg, var(--accent-x), var(--accent-o));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .ttt-subtitle {
      text-align: center;
      color: var(--text-dim);
      font-size: 13px;
      margin: 0 0 20px;
    }

    /* ---- Mode Select Screen ---- */
    .ttt-modes {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .ttt-mode-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid var(--panel-border);
      background: rgba(255,255,255,0.04);
      color: var(--text-main);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      text-align: left;
    }
    .ttt-mode-btn:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.09);
      border-color: var(--accent-x);
    }
    .ttt-mode-icon {
      font-size: 22px;
      width: 34px;
      text-align: center;
    }
    .ttt-mode-desc {
      display: block;
      font-weight: 400;
      font-size: 12px;
      color: var(--text-dim);
      margin-top: 2px;
    }

    .ttt-diff-row {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }
    .ttt-diff-btn {
      flex: 1;
      padding: 10px 8px;
      border-radius: 12px;
      border: 1px solid var(--panel-border);
      background: rgba(255,255,255,0.04);
      color: var(--text-main);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ttt-diff-btn:hover {
      background: rgba(255,255,255,0.1);
      border-color: var(--accent-o);
    }
    .ttt-back-link {
      display: inline-block;
      margin-top: 14px;
      font-size: 12px;
      color: var(--text-dim);
      cursor: pointer;
      text-decoration: underline;
    }
    .ttt-back-link:hover { color: var(--text-main); }

    /* ---- Game Screen ---- */
    .ttt-hidden { display: none !important; }

    .ttt-scoreboard {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 16px;
    }
    .ttt-score {
      flex: 1;
      text-align: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      padding: 8px 4px;
    }
    .ttt-score .label {
      font-size: 11px;
      color: var(--text-dim);
      display: block;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }
    .ttt-score .value {
      font-size: 20px;
      font-weight: 800;
    }
    .ttt-score.x .value { color: var(--accent-x); }
    .ttt-score.o .value { color: var(--accent-o); }
    .ttt-score.d .value { color: var(--text-dim); }

    .ttt-status {
      text-align: center;
      font-size: 15px;
      font-weight: 600;
      min-height: 22px;
      margin-bottom: 14px;
      color: var(--text-main);
      transition: color 0.2s ease;
    }
    .ttt-status .turn-x { color: var(--accent-x); }
    .ttt-status .turn-o { color: var(--accent-o); }

    .ttt-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      aspect-ratio: 1 / 1;
      margin: 0 auto;
      max-width: 340px;
    }
    .ttt-cell {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--panel-border);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(32px, 9vw, 52px);
      font-weight: 800;
      cursor: pointer;
      user-select: none;
      position: relative;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .ttt-cell:hover:not(.filled) {
      background: rgba(255,255,255,0.1);
      transform: translateY(-1px);
    }
    .ttt-cell.filled { cursor: default; }
    .ttt-cell.win-cell {
      background: rgba(124,252,154,0.18);
      border-color: var(--win-glow);
      box-shadow: 0 0 18px rgba(124,252,154,0.35);
    }
    .ttt-mark {
      display: inline-block;
      animation: ttt-pop 0.28s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes ttt-pop {
      0% { transform: scale(0) rotate(-15deg); opacity: 0; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .ttt-mark.x { color: var(--accent-x); text-shadow: 0 0 14px rgba(79,209,255,0.5); }
    .ttt-mark.o { color: var(--accent-o); text-shadow: 0 0 14px rgba(255,107,157,0.5); }

    .ttt-controls {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .ttt-btn {
      flex: 1;
      padding: 11px;
      border-radius: 12px;
      border: 1px solid var(--panel-border);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
      color: var(--text-main);
    }
    .ttt-btn.primary {
      background: linear-gradient(90deg, var(--accent-x), var(--accent-o));
      border: none;
      color: #14162b;
    }
    .ttt-btn.secondary {
      background: rgba(255,255,255,0.05);
    }
    .ttt-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
    .ttt-btn:active { transform: translateY(0); }

    .ttt-banner {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      margin-top: 14px;
      padding: 10px;
      border-radius: 12px;
      min-height: 20px;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .ttt-banner.show {
      opacity: 1;
      transform: translateY(0);
    }
    .ttt-banner.win {
      background: rgba(124,252,154,0.15);
      color: var(--win-glow);
      border: 1px solid rgba(124,252,154,0.4);
    }
    .ttt-banner.draw {
      background: rgba(255,255,255,0.08);
      color: var(--text-dim);
      border: 1px solid var(--panel-border);
    }

    @media (max-width: 400px) {
      .ttt-card { padding: 20px 16px 18px; }
    }
  `;
  document.head.appendChild(style);

  /* ----------------------------------------------------------
     2. BUILD HTML STRUCTURE (DOM manipulation, no document.write)
     ---------------------------------------------------------- */
  const root = document.createElement('div');
  root.id = 'ttt-root';
  root.innerHTML = `
    <div class="ttt-card">
      <h1 class="ttt-title">TIC · TAC · TOE</h1>
      <p class="ttt-subtitle" id="ttt-subtitle">Choose how you want to play</p>

      <!-- MODE SELECT SCREEN -->
      <div id="ttt-mode-screen">
        <div class="ttt-modes">
          <button class="ttt-mode-btn" data-mode="2p">
            <span class="ttt-mode-icon">🧑‍🤝‍🧑</span>
            <span>
              2 Players
              <span class="ttt-mode-desc">Play locally, pass the same device</span>
            </span>
          </button>
          <button class="ttt-mode-btn" data-mode="bot">
            <span class="ttt-mode-icon">🤖</span>
            <span>
              Play with Bot
              <span class="ttt-mode-desc">Choose Easy or Medium difficulty</span>
            </span>
          </button>
          <button class="ttt-mode-btn" data-mode="botpro">
            <span class="ttt-mode-icon">🧠</span>
            <span>
              Play with Bot Pro
              <span class="ttt-mode-desc">Unbeatable — powered by Minimax</span>
            </span>
          </button>
        </div>

        <!-- Difficulty sub-screen (hidden until "Play with Bot" chosen) -->
        <div id="ttt-diff-screen" class="ttt-hidden" style="margin-top:16px;">
          <p class="ttt-subtitle" style="margin-bottom:8px;">Select difficulty</p>
          <div class="ttt-diff-row">
            <button class="ttt-diff-btn" data-diff="easy">Easy</button>
            <button class="ttt-diff-btn" data-diff="medium">Medium</button>
          </div>
          <span class="ttt-back-link" id="ttt-diff-back">← Back to modes</span>
        </div>
      </div>

      <!-- GAME SCREEN -->
      <div id="ttt-game-screen" class="ttt-hidden">
        <div class="ttt-scoreboard">
          <div class="ttt-score x">
            <span class="label" id="ttt-label-x">X</span>
            <span class="value" id="ttt-score-x">0</span>
          </div>
          <div class="ttt-score d">
            <span class="label">DRAWS</span>
            <span class="value" id="ttt-score-d">0</span>
          </div>
          <div class="ttt-score o">
            <span class="label" id="ttt-label-o">O</span>
            <span class="value" id="ttt-score-o">0</span>
          </div>
        </div>

        <div class="ttt-status" id="ttt-status">—</div>

        <div class="ttt-board" id="ttt-board"></div>

        <div class="ttt-banner" id="ttt-banner"></div>

        <div class="ttt-controls">
          <button class="ttt-btn secondary" id="ttt-btn-menu">Change Mode</button>
          <button class="ttt-btn primary" id="ttt-btn-restart">Restart</button>
        </div>
      </div>
    </div>
  `;

  function mountRoot() {
    document.body.appendChild(root);
  }
  if (document.body) {
    mountRoot();
  } else {
    document.addEventListener('DOMContentLoaded', mountRoot);
  }

  /* ----------------------------------------------------------
     3. GAME STATE & LOGIC
     ---------------------------------------------------------- */
  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const state = {
    mode: null,        // '2p' | 'bot' | 'botpro'
    difficulty: null,  // 'easy' | 'medium' (for 'bot' mode)
    board: Array(9).fill(null),
    current: 'X',       // whose turn
    humanMark: 'X',
    botMark: 'O',
    scores: { X: 0, O: 0, D: 0 },
    gameOver: false,
    busy: false // true while bot is "thinking" to block input
  };

  // Cache DOM refs after mount
  let el = {};
  function cacheEls() {
    el.modeScreen = document.getElementById('ttt-mode-screen');
    el.diffScreen = document.getElementById('ttt-diff-screen');
    el.gameScreen = document.getElementById('ttt-game-screen');
    el.subtitle = document.getElementById('ttt-subtitle');
    el.board = document.getElementById('ttt-board');
    el.status = document.getElementById('ttt-status');
    el.banner = document.getElementById('ttt-banner');
    el.scoreX = document.getElementById('ttt-score-x');
    el.scoreO = document.getElementById('ttt-score-o');
    el.scoreD = document.getElementById('ttt-score-d');
    el.labelX = document.getElementById('ttt-label-x');
    el.labelO = document.getElementById('ttt-label-o');
    el.btnMenu = document.getElementById('ttt-btn-menu');
    el.btnRestart = document.getElementById('ttt-btn-restart');
    el.diffBack = document.getElementById('ttt-diff-back');
  }

  function initEventListeners() {
    // Mode buttons
    document.querySelectorAll('.ttt-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === 'bot') {
          el.diffScreen.classList.remove('ttt-hidden');
        } else {
          startGame(mode, null);
        }
      });
    });

    // Difficulty buttons
    document.querySelectorAll('.ttt-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.getAttribute('data-diff');
        startGame('bot', diff);
      });
    });

    el.diffBack.addEventListener('click', () => {
      el.diffScreen.classList.add('ttt-hidden');
    });

    el.btnMenu.addEventListener('click', goToMenu);
    el.btnRestart.addEventListener('click', () => resetBoard(true));
  }

  function goToMenu() {
    state.mode = null;
    state.difficulty = null;
    el.gameScreen.classList.add('ttt-hidden');
    el.diffScreen.classList.add('ttt-hidden');
    el.modeScreen.classList.remove('ttt-hidden');
    el.subtitle.textContent = 'Choose how you want to play';
    // reset scores for a clean new session
    state.scores = { X: 0, O: 0, D: 0 };
  }

  function startGame(mode, difficulty) {
    state.mode = mode;
    state.difficulty = difficulty;
    state.scores = { X: 0, O: 0, D: 0 };

    el.modeScreen.classList.add('ttt-hidden');
    el.diffScreen.classList.add('ttt-hidden');
    el.gameScreen.classList.remove('ttt-hidden');

    if (mode === '2p') {
      el.subtitle.textContent = '2 Players — Local';
      el.labelX.textContent = 'PLAYER X';
      el.labelO.textContent = 'PLAYER O';
    } else if (mode === 'bot') {
      el.subtitle.textContent = `Vs Bot (${capitalize(difficulty)})`;
      el.labelX.textContent = 'YOU';
      el.labelO.textContent = 'BOT';
    } else if (mode === 'botpro') {
      el.subtitle.textContent = 'Vs Bot Pro — Unbeatable';
      el.labelX.textContent = 'YOU';
      el.labelO.textContent = 'BOT PRO';
    }

    buildBoardDOM();
    resetBoard(false);
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function buildBoardDOM() {
    el.board.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      cell.setAttribute('data-idx', i);
      cell.addEventListener('click', onCellClick);
      el.board.appendChild(cell);
    }
  }

  function resetBoard(keepScores) {
    state.board = Array(9).fill(null);
    state.current = 'X';
    state.gameOver = false;
    state.busy = false;
    el.banner.textContent = '';
    el.banner.className = 'ttt-banner';

    document.querySelectorAll('.ttt-cell').forEach(c => {
      c.innerHTML = '';
      c.classList.remove('filled', 'win-cell');
    });

    if (!keepScores) {
      updateScoreboard();
    }
    updateStatus();
  }

  function updateScoreboard() {
    el.scoreX.textContent = state.scores.X;
    el.scoreO.textContent = state.scores.O;
    el.scoreD.textContent = state.scores.D;
  }

  function updateStatus(customText) {
    if (customText) {
      el.status.innerHTML = customText;
      return;
    }
    const whose = state.current === 'X' ? 'turn-x' : 'turn-o';
    let label;
    if (state.mode === '2p') {
      label = state.current === 'X' ? 'Player X' : 'Player O';
    } else {
      label = state.current === state.humanMark ? 'Your turn' : 'Bot is thinking…';
    }
    el.status.innerHTML = `<span class="${whose}">${label}</span>`;
  }

  function onCellClick(e) {
    if (state.gameOver || state.busy) return;
    const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
    if (state.board[idx]) return;

    // In bot modes, block clicks when it's not human's turn
    if ((state.mode === 'bot' || state.mode === 'botpro') && state.current !== state.humanMark) {
      return;
    }

    placeMark(idx, state.current);

    if (checkEndAndHandle()) return;

    switchTurn();

    // Trigger bot move if applicable
    if ((state.mode === 'bot' || state.mode === 'botpro') && state.current === state.botMark) {
      state.busy = true;
      updateStatus();
      setTimeout(() => {
        const idx2 = getBotMove();
        if (idx2 !== -1 && !state.gameOver) {
          placeMark(idx2, state.current);
          if (!checkEndAndHandle()) {
            switchTurn();
          }
        }
        state.busy = false;
      }, 420); // small "thinking" delay for UX
    }
  }

  function placeMark(idx, mark) {
    state.board[idx] = mark;
    const cell = el.board.querySelector(`[data-idx="${idx}"]`);
    cell.classList.add('filled');
    const span = document.createElement('span');
    span.className = `ttt-mark ${mark.toLowerCase()}`;
    span.textContent = mark;
    cell.appendChild(span);
  }

  function switchTurn() {
    state.current = state.current === 'X' ? 'O' : 'X';
    updateStatus();
  }

  function getWinner(board) {
    for (const line of WIN_LINES) {
      const [a,b,c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { mark: board[a], line };
      }
    }
    if (board.every(c => c)) return { mark: 'D', line: null };
    return null;
  }

  function checkEndAndHandle() {
    const result = getWinner(state.board);
    if (!result) return false;

    state.gameOver = true;

    if (result.mark === 'D') {
      state.scores.D++;
      el.banner.textContent = "🤝 It's a Draw!";
      el.banner.classList.add('draw', 'show');
      updateStatus(`<span style="color:var(--text-dim)">Draw</span>`);
    } else {
      state.scores[result.mark]++;
      result.line.forEach(i => {
        el.board.querySelector(`[data-idx="${i}"]`).classList.add('win-cell');
      });
      let winnerLabel;
      if (state.mode === '2p') {
        winnerLabel = `Player ${result.mark}`;
      } else {
        winnerLabel = result.mark === state.humanMark ? 'You' : 'Bot';
      }
      el.banner.textContent = `🎉 ${winnerLabel} Win${winnerLabel === 'You' ? '' : 's'}!`;
      el.banner.classList.add('win', 'show');
      updateStatus(`<span style="color:var(--win-glow)">${winnerLabel} won!</span>`);
    }

    updateScoreboard();
    return true;
  }

  /* ----------------------------------------------------------
     4. BOT AI
     ---------------------------------------------------------- */

  function getBotMove() {
    const empties = state.board.reduce((acc, v, i) => { if (!v) acc.push(i); return acc; }, []);
    if (empties.length === 0) return -1;

    if (state.mode === 'botpro') {
      return getBestMoveMinimax(state.board.slice(), state.botMark, state.humanMark);
    }

    // 'bot' mode: easy / medium
    if (state.difficulty === 'easy') {
      // Fully random
      return empties[Math.floor(Math.random() * empties.length)];
    }

    // Medium: try to win, else block, else random (no deep lookahead)
    const winMove = findImmediateMove(state.board, state.botMark);
    if (winMove !== -1) return winMove;

    const blockMove = findImmediateMove(state.board, state.humanMark);
    if (blockMove !== -1) return blockMove;

    // Slight preference for center/corners for a "smarter" feel
    const preferred = [4,0,2,6,8,1,3,5,7].filter(i => empties.includes(i));
    if (Math.random() < 0.7 && preferred.length) return preferred[0];

    return empties[Math.floor(Math.random() * empties.length)];
  }

  function findImmediateMove(board, mark) {
    for (const line of WIN_LINES) {
      const vals = line.map(i => board[i]);
      const markCount = vals.filter(v => v === mark).length;
      const emptyCount = vals.filter(v => !v).length;
      if (markCount === 2 && emptyCount === 1) {
        return line[vals.findIndex(v => !v)];
      }
    }
    return -1;
  }

  // Minimax with alpha-beta pruning — unbeatable
  function getBestMoveMinimax(board, botMark, humanMark) {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = botMark;
        const score = minimax(board, 0, false, botMark, humanMark, -Infinity, Infinity);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  function minimax(board, depth, isMaximizing, botMark, humanMark, alpha, beta) {
    const result = getWinner(board);
    if (result) {
      if (result.mark === botMark) return 10 - depth;
      if (result.mark === humanMark) return depth - 10;
      return 0; // draw
    }

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = botMark;
          best = Math.max(best, minimax(board, depth + 1, false, botMark, humanMark, alpha, beta));
          board[i] = null;
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = humanMark;
          best = Math.min(best, minimax(board, depth + 1, true, botMark, humanMark, alpha, beta));
          board[i] = null;
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
  }

  /* ----------------------------------------------------------
     5. INIT
     ---------------------------------------------------------- */
  function init() {
    cacheEls();
    initEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // If body already existed when script ran, root is mounted synchronously above
    init();
  }
})();
