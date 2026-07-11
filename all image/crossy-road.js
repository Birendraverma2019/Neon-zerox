/* Crossy Road — plugs into NexusGames.crossyRoad { mount, unmount } */
(() => {
  'use strict';
  window.NexusGames = window.NexusGames || {};

  window.NexusGames.crossyRoad = {
    mount(container) {
      const COLS = 9, ROWS = 12, CELL = 40;
      const W = COLS * CELL, H = ROWS * CELL;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-family:inherit;';
      wrap.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;opacity:.85;"><span>SCORE: <b id="cr-score">0</b></span><span>BEST: <b id="cr-best">0</b></span></div>
        <canvas id="cr-canvas" width="${W}" height="${H}" style="background:#0a0e14;border:1px solid rgba(255,255,255,.15);border-radius:8px;"></canvas>
        <p style="font-size:12px;opacity:.6;">Arrow keys / WASD to hop &middot; don't get hit</p>
        <div id="cr-over" style="display:none;flex-direction:column;gap:8px;align-items:center;">
          <p style="font-size:15px;">SPLAT!</p>
          <button id="cr-restart" style="padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;">Restart</button>
        </div>
      `;
      container.appendChild(wrap);

      const canvas = wrap.querySelector('#cr-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = wrap.querySelector('#cr-score');
      const bestEl = wrap.querySelector('#cr-best');
      const overEl = wrap.querySelector('#cr-over');
      const restartBtn = wrap.querySelector('#cr-restart');

      let best = Number(localStorage.getItem('nexus-crossy-best') || 0);
      bestEl.textContent = best;

      let lanes, player, score, alive, raf, camRow;

      function laneType(i) {
        if (i === 0) return 'safe';
        return Math.random() < 0.6 ? 'road' : 'safe';
      }

      function makeLane(rowIndex) {
        const type = laneType(rowIndex);
        const dir = Math.random() < 0.5 ? 1 : -1;
        const speed = 0.6 + Math.random() * 0.8;
        const cars = [];
        if (type === 'road') {
          const count = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            cars.push({ x: Math.random() * COLS, w: 1.4 });
          }
        }
        return { type, dir, speed, cars, y: rowIndex };
      }

      function reset() {
        lanes = [];
        for (let i = 0; i < 40; i++) lanes.push(makeLane(i));
        player = { col: Math.floor(COLS / 2), row: 0 };
        score = 0;
        alive = true;
        camRow = 0;
        scoreEl.textContent = score;
        overEl.style.display = 'none';
      }

      function ensureLanes() {
        while (lanes.length < player.row + 15) lanes.push(makeLane(lanes.length));
      }

      function update() {
        lanes.forEach(lane => {
          if (lane.type === 'road') {
            lane.cars.forEach(car => {
              car.x += lane.dir * lane.speed * 0.05;
              if (car.x > COLS + 1) car.x = -1.5;
              if (car.x < -1.5) car.x = COLS + 1;
            });
          }
        });

        const currentLane = lanes[player.row];
        if (currentLane && currentLane.type === 'road') {
          const hit = currentLane.cars.some(car => Math.abs(car.x - player.col) < (car.w / 2 + 0.35));
          if (hit) {
            alive = false;
            if (score > best) {
              best = score;
              localStorage.setItem('nexus-crossy-best', String(best));
              bestEl.textContent = best;
            }
            overEl.style.display = 'flex';
          }
        }
      }

      function draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        const visibleRows = ROWS;
        for (let vr = 0; vr < visibleRows; vr++) {
          const rowIndex = camRow + (ROWS - 1 - vr);
          const lane = lanes[rowIndex];
          if (!lane) continue;
          const y = vr * CELL;
          ctx.fillStyle = lane.type === 'road' ? 'rgba(255,255,255,.05)' : 'rgba(57,255,20,.06)';
          ctx.fillRect(0, y, W, CELL);
          if (lane.type === 'road') {
            lane.cars.forEach(car => {
              ctx.fillStyle = '#ff2d78';
              const cx = car.x * CELL;
              ctx.fillRect(cx - (car.w * CELL) / 2, y + 8, car.w * CELL, CELL - 16);
            });
          }
        }

        const playerVr = ROWS - 1 - (player.row - camRow);
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(player.col * CELL + CELL / 2, playerVr * CELL + CELL / 2, CELL / 2 - 6, 0, Math.PI * 2);
        ctx.fill();
      }

      function loop() {
        if (alive) {
          update();
          draw();
          raf = requestAnimationFrame(loop);
        } else {
          draw();
        }
      }

      function onKey(e) {
        if (!alive) return;
        let moved = false;
        if (e.key === 'ArrowUp' || e.key === 'w') { player.row++; moved = true; }
        else if (e.key === 'ArrowDown' || e.key === 's') { player.row = Math.max(0, player.row - 1); moved = true; }
        else if (e.key === 'ArrowLeft' || e.key === 'a') { player.col = Math.max(0, player.col - 1); moved = true; }
        else if (e.key === 'ArrowRight' || e.key === 'd') { player.col = Math.min(COLS - 1, player.col + 1); moved = true; }
        if (moved) {
          e.preventDefault();
          ensureLanes();
          if (player.row > camRow + 1) camRow = player.row - 1;
          if (player.row > score) {
            score = player.row;
            scoreEl.textContent = score;
          }
        }
      }

      document.addEventListener('keydown', onKey);
      restartBtn.addEventListener('click', () => { reset(); raf = requestAnimationFrame(loop); });

      reset();
      draw();
      raf = requestAnimationFrame(loop);

      this._cleanup = () => {
        cancelAnimationFrame(raf);
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
