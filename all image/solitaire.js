/* Solitaire — plugs into NexusGames.solitaire { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  const SUITS = [{ s: '\u2660', red: false }, { s: '\u2665', red: true }, { s: '\u2666', red: true }, { s: '\u2663', red: false }];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  function freshDeck() {
    const deck = [];
    SUITS.forEach((suit, si) => {
      RANKS.forEach((rank, ri) => {
        deck.push({ suit: suit.s, red: suit.red, rank, value: ri + 1, id: `${si}-${ri}` });
      });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  window.NexusGames.solitaire = {
    mount(container) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px;color:#fff;font-family:inherit;user-select:none;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>MOVES: <b id="sol-moves">0</b></span></div>
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <div id="sol-stock" style="width:52px;height:72px;border:1px dashed rgba(255,255,255,.4);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,.05);font-size:11px;">DRAW</div>
          <div id="sol-waste" style="width:52px;height:72px;border:1px dashed rgba(255,255,255,.2);border-radius:6px;"></div>
          <div style="width:1px;height:72px;background:rgba(255,255,255,.15);"></div>
          <div id="sol-foundations" style="display:flex;gap:8px;"></div>
        </div>
        <div id="sol-tableau" style="display:flex;gap:14px;"></div>
        <p style="font-size:12px;opacity:.6;">Click stock to draw &middot; click waste/tableau card then a target pile to move</p>
        <button id="sol-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">New Game</button>
      `;
      container.appendChild(wrap);

      const stockEl = wrap.querySelector('#sol-stock');
      const wasteEl = wrap.querySelector('#sol-waste');
      const foundationsEl = wrap.querySelector('#sol-foundations');
      const tableauEl = wrap.querySelector('#sol-tableau');
      const movesEl = wrap.querySelector('#sol-moves');
      const restartBtn = wrap.querySelector('#sol-restart');

      let stock, waste, foundations, tableau, moves, selected;

      function cardColor(card) { return card.red ? '#ff2d78' : '#e6e6e6'; }

      function reset() {
        const deck = freshDeck();
        tableau = [];
        for (let i = 0; i < 7; i++) {
          const pile = deck.splice(0, i + 1).map((c, idx) => ({ ...c, faceUp: idx === i }));
          tableau.push(pile);
        }
        stock = deck.map(c => ({ ...c, faceUp: false }));
        waste = [];
        foundations = [[], [], [], []];
        moves = 0;
        selected = null;
        movesEl.textContent = moves;
        render();
      }

      function cardEl(card, interactive) {
        const el = document.createElement('div');
        const isSel = selected && selected.card && selected.card.id === card.id;
        el.style.cssText = `width:48px;height:66px;border-radius:5px;background:${card.faceUp ? '#12161f' : 'linear-gradient(135deg,#00e5ff,#5c7cff)'};border:1px solid ${isSel ? '#00e5ff' : 'rgba(255,255,255,.25)'};display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${card.faceUp ? cardColor(card) : 'transparent'};cursor:${interactive ? 'pointer' : 'default'};box-shadow:${isSel ? '0 0 8px rgba(0,229,255,.6)' : 'none'};`;
        if (card.faceUp) el.innerHTML = `<span>${card.rank}</span><span>${card.suit}</span>`;
        return el;
      }

      function render() {
        stockEl.textContent = stock.length ? `${stock.length}` : 'DRAW';
        wasteEl.innerHTML = '';
        if (waste.length) {
          const top = waste[waste.length - 1];
          const el = cardEl(top, true);
          el.addEventListener('click', () => selectFrom('waste'));
          wasteEl.appendChild(el);
        }

        foundationsEl.innerHTML = '';
        foundations.forEach((pile, i) => {
          const slot = document.createElement('div');
          slot.style.cssText = 'width:52px;height:72px;border:1px dashed rgba(255,255,255,.25);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
          if (pile.length) slot.appendChild(cardEl(pile[pile.length - 1], false));
          else slot.textContent = SUITS[i].s;
          slot.addEventListener('click', () => tryMoveTo({ type: 'foundation', index: i }));
          foundationsEl.appendChild(slot);
        });

        tableauEl.innerHTML = '';
        tableau.forEach((pile, colIdx) => {
          const col = document.createElement('div');
          col.style.cssText = 'position:relative;width:52px;min-height:200px;';
          pile.forEach((card, cardIdx) => {
            const el = cardEl(card, card.faceUp);
            el.style.position = 'absolute';
            el.style.top = `${cardIdx * 20}px`;
            el.style.left = '0';
            if (card.faceUp) {
              el.addEventListener('click', () => selectFrom('tableau', colIdx, cardIdx));
            }
            col.appendChild(el);
          });
          if (!pile.length) {
            const slot = document.createElement('div');
            slot.style.cssText = 'width:52px;height:72px;border:1px dashed rgba(255,255,255,.2);border-radius:6px;';
            slot.addEventListener('click', () => tryMoveTo({ type: 'tableau', index: colIdx }));
            col.appendChild(slot);
          } else {
            col.addEventListener('click', (e) => {
              if (e.target === col) tryMoveTo({ type: 'tableau', index: colIdx });
            });
          }
          tableauEl.appendChild(col);
        });
        movesEl.textContent = moves;
      }

      function selectFrom(source, colIdx, cardIdx) {
        if (source === 'waste') {
          if (!waste.length) return;
          selected = { source, card: waste[waste.length - 1] };
        } else {
          const pile = tableau[colIdx];
          const card = pile[cardIdx];
          if (!card.faceUp) return;
          selected = { source, colIdx, cardIdx, card };
        }
        render();
      }

      function canStackTableau(card, targetPile) {
        if (!targetPile.length) return card.value === 13;
        const top = targetPile[targetPile.length - 1];
        return top.faceUp && top.value === card.value + 1 && top.red !== card.red;
      }

      function canStackFoundation(card, pile, suitIndex) {
        if (card.suit !== SUITS[suitIndex].s) return false;
        if (!pile.length) return card.value === 1;
        return pile[pile.length - 1].value === card.value - 1;
      }

      function tryMoveTo(target) {
        if (!selected) return;
        const card = selected.card;

        if (target.type === 'foundation') {
          if (!canStackFoundation(card, foundations[target.index], target.index)) { selected = null; render(); return; }
          removeSelected();
          foundations[target.index].push(card);
          moves++;
          selected = null;
          render();
          return;
        }

        if (target.type === 'tableau') {
          const destPile = tableau[target.index];
          if (selected.source === 'tableau' && selected.colIdx === target.index) { selected = null; render(); return; }
          if (!canStackTableau(card, destPile)) { selected = null; render(); return; }

          if (selected.source === 'waste') {
            waste.pop();
            destPile.push(card);
          } else {
            const moving = tableau[selected.colIdx].splice(selected.cardIdx);
            destPile.push(...moving);
          }
          moves++;
          selected = null;
          render();
        }
      }

      function removeSelected() {
        if (selected.source === 'waste') waste.pop();
        else tableau[selected.colIdx].splice(selected.cardIdx, 1);
      }

      function drawStock() {
        if (!stock.length) {
          stock = waste.reverse().map(c => ({ ...c, faceUp: false }));
          waste = [];
        } else {
          const card = stock.pop();
          card.faceUp = true;
          waste.push(card);
        }
        selected = null;
        render();
      }

      stockEl.addEventListener('click', drawStock);
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
