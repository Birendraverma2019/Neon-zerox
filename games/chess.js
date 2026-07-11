/* Chess — plugs into NexusGames.chess { mount, unmount }
   Basic legal-move chess (no check/checkmate detection, no castling/en-passant). */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const PIECES = { K: '\u265A', Q: '\u265B', R: '\u265C', B: '\u265D', N: '\u265E', P: '\u265F' };

  function initialBoard() {
    const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: back[c], color: 'b' };
      board[1][c] = { type: 'P', color: 'b' };
      board[6][c] = { type: 'P', color: 'w' };
      board[7][c] = { type: back[c], color: 'w' };
    }
    return board;
  }

  function pathClear(board, r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    let r = r1 + dr, c = c1 + dc;
    while (r !== r2 || c !== c2) {
      if (board[r][c]) return false;
      r += dr; c += dc;
    }
    return true;
  }

  function isLegalMove(board, r1, c1, r2, c2) {
    const piece = board[r1][c1];
    if (!piece) return false;
    const target = board[r2][c2];
    if (target && target.color === piece.color) return false;
    const dr = r2 - r1, dc = c2 - c1;
    const adr = Math.abs(dr), adc = Math.abs(dc);

    switch (piece.type) {
      case 'P': {
        const dir = piece.color === 'w' ? -1 : 1;
        const startRow = piece.color === 'w' ? 6 : 1;
        if (dc === 0 && !target) {
          if (dr === dir) return true;
          if (r1 === startRow && dr === 2 * dir && !board[r1 + dir][c1]) return true;
        }
        if (adc === 1 && dr === dir && target && target.color !== piece.color) return true;
        return false;
      }
      case 'N':
        return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
      case 'B':
        return adr === adc && adr > 0 && pathClear(board, r1, c1, r2, c2);
      case 'R':
        return (dr === 0 || dc === 0) && (adr + adc > 0) && pathClear(board, r1, c1, r2, c2);
      case 'Q':
        return ((dr === 0 || dc === 0) || adr === adc) && (adr + adc > 0) && pathClear(board, r1, c1, r2, c2);
      case 'K':
        return adr <= 1 && adc <= 1 && (adr + adc > 0);
      default:
        return false;
    }
  }

  window.NexusGames.chess = {
    mount(container) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <p id="chs-turn" style="font-size:14px;opacity:.85;letter-spacing:.05em;">WHITE TO MOVE</p>
        <div id="chs-board" style="display:grid;grid-template-columns:repeat(8,44px);grid-template-rows:repeat(8,44px);border:2px solid rgba(255,255,255,.3);border-radius:4px;overflow:hidden;"></div>
        <p style="font-size:12px;opacity:.6;max-width:340px;text-align:center;">Click a piece then a destination. Basic move rules only \u2014 no check/checkmate detection, for casual play.</p>
        <button id="chs-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">New Game</button>
      `;
      container.appendChild(wrap);

      const boardEl = wrap.querySelector('#chs-board');
      const turnEl = wrap.querySelector('#chs-turn');
      const restartBtn = wrap.querySelector('#chs-restart');

      let board, turn, selected, cellEls;

      function reset() {
        board = initialBoard();
        turn = 'w';
        selected = null;
        turnEl.textContent = 'WHITE TO MOVE';
        render();
      }

      function render() {
        boardEl.innerHTML = '';
        cellEls = [];
        for (let r = 0; r < 8; r++) {
          const row = [];
          for (let c = 0; c < 8; c++) {
            const el = document.createElement('div');
            const dark = (r + c) % 2 === 1;
            const isSel = selected && selected[0] === r && selected[1] === c;
            el.style.cssText = `width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;background:${isSel ? 'rgba(0,229,255,.4)' : dark ? '#1a2030' : '#2a3448'};`;
            const piece = board[r][c];
            if (piece) {
              el.textContent = PIECES[piece.type];
              el.style.color = piece.color === 'w' ? '#fff' : '#ff2d78';
            }
            el.addEventListener('click', () => onCellClick(r, c));
            boardEl.appendChild(el);
            row.push(el);
          }
          cellEls.push(row);
        }
      }

      function onCellClick(r, c) {
        const piece = board[r][c];
        if (selected) {
          const [r1, c1] = selected;
          if (r1 === r && c1 === c) { selected = null; render(); return; }
          if (isLegalMove(board, r1, c1, r, c)) {
            const captured = board[r][c];
            board[r][c] = board[r1][c1];
            board[r1][c1] = null;
            selected = null;
            turn = turn === 'w' ? 'b' : 'w';
            turnEl.textContent = (turn === 'w' ? 'WHITE' : 'BLACK') + ' TO MOVE' + (captured && captured.type === 'K' ? ' \u2014 KING CAPTURED!' : '');
            render();
            return;
          }
          if (piece && piece.color === turn) { selected = [r, c]; render(); return; }
          selected = null;
          render();
          return;
        }
        if (piece && piece.color === turn) {
          selected = [r, c];
          render();
        }
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
