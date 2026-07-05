/* ==================================================================
   NEXUS ARCADE — Cartridge: Tic Tac Toe
   Registers itself on window.NexusGames.ticTacToe following the
   mount/unmount contract expected by script.js's Game Engine.
   ================================================================== */
(() => {
  'use strict';

  const STYLE_ID = 'nexus-ttt-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ttt { display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: 'Rajdhani', sans-serif; color: #eaf2ff; }
      .ttt__status { font-family: 'Orbitron', sans-serif; font-size: 13px; letter-spacing: 0.08em; color: #00f6ff; text-shadow: 0 0 8px rgba(0,246,255,.5); min-height: 18px; }
      .ttt__board { display: grid; grid-template-columns: repeat(3, 76px); grid-template-rows: repeat(3, 76px); gap: 8px; }
      .ttt__cell { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; font-family: 'Orbitron', sans-serif; font-size: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .2s, box-shadow .2s; color: #eaf2ff; }
      .ttt__cell:hover:not(:disabled) { border-color: #00f6ff; box-shadow: 0 0 12px rgba(0,246,255,.35); }
      .ttt__cell[data-mark="X"] { color: #00f6ff; text-shadow: 0 0 10px rgba(0,246,255,.6); }
      .ttt__cell[data-mark="O"] { color: #ff2ee6; text-shadow: 0 0 10px rgba(255,46,230,.6); }
      .ttt__reset { border: 1px solid #b6ff2a; color: #b6ff2a; background: transparent; font-family: 'Orbitron', sans-serif; font-size: 11px; letter-spacing: .08em; padding: 8px 18px; border-radius: 999px; cursor: pointer; transition: background .2s, color .2s, box-shadow .2s; }
      .ttt__reset:hover { background: #b6ff2a; color: #05060b; box-shadow: 0 0 16px rgba(182,255,42,.5); }
    `;
    document.head.appendChild(style);
  }

  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];

  function createGame(container) {
    injectStyles();

    let board = Array(9).fill(null);
    let current = 'X';
    let over = false;

    const root = document.createElement('div');
    root.className = 'ttt';
    root.innerHTML = `
      <div class="ttt__status" data-role="status">PLAYER X&rsquo;S TURN</div>
      <div class="ttt__board" data-role="board"></div>
      <button type="button" class="ttt__reset" data-role="reset">RESTART</button>
    `;
    container.appendChild(root);

    const statusEl = root.querySelector('[data-role="status"]');
    const boardEl  = root.querySelector('[data-role="board"]');
    const resetBtn = root.querySelector('[data-role="reset"]');

    const cells = board.map((_, i) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'ttt__cell';
      cell.dataset.index = i;
      cell.addEventListener('click', () => handleMove(i));
      boardEl.appendChild(cell);
      return cell;
    });

    function checkWinner() {
      for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
      }
      return board.every(Boolean) ? 'DRAW' : null;
    }

    function handleMove(i) {
      if (over || board[i]) return;
      board[i] = current;
      cells[i].textContent = current;
      cells[i].dataset.mark = current;
      cells[i].disabled = true;

      const result = checkWinner();
      if (result === 'DRAW') {
        over = true;
        statusEl.textContent = "IT'S A DRAW";
      } else if (result) {
        over = true;
        statusEl.textContent = `PLAYER ${result} WINS!`;
      } else {
        current = current === 'X' ? 'O' : 'X';
        statusEl.textContent = `PLAYER ${current}\u2019S TURN`;
      }
    }

    function reset() {
      board = Array(9).fill(null);
      current = 'X';
      over = false;
      cells.forEach((cell) => {
        cell.textContent = '';
        cell.removeAttribute('data-mark');
        cell.disabled = false;
      });
      statusEl.textContent = "PLAYER X\u2019S TURN";
    }

    resetBtn.addEventListener('click', reset);

    return {
      destroy() {
        root.remove();
      },
    };
  }

  let instance = null;

  window.NexusGames = window.NexusGames || {};
  window.NexusGames.ticTacToe = {
    mount(container) {
      instance = createGame(container);
    },
    unmount() {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    },
  };
})();
