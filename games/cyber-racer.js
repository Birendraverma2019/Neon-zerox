/* ==================================================================
   NEXUS ARCADE — Cartridge: Cyber Racer
   Registers itself on window.NexusGames.cyberRacer
   ================================================================== */
(() => {
  'use strict';

  const W = 320, H = 420;
  const LANES = 3;
  const LANE_W = W / LANES;
  const CAR_W = 40, CAR_H = 64;

  function createGame(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Orbitron,sans-serif;';
    wrap.innerHTML = `
      <div style="font-size:12px;letter-spacing:.08em;color:#00f6ff;text-shadow:0 0 8px rgba(0,246,255,.5);">
        DISTANCE: <span data-role="score">0</span>m &nbsp;|&nbsp; BEST: <span data-role="best">0</span>m
      </div>
      <canvas width="${W}" height="${H}" style="background:#0a0d16;border:1px solid rgba(0,246,255,.4);border-radius:10px;box-shadow:0 0 20px rgba(0,246,255,.2);touch-action:manipulation;"></canvas>
      <div style="font-size:11px;color:#8b93ac;">&larr; &rarr; ARROW KEYS / SWIPE TO CHANGE LANE</div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('[data-role="score"]');
    const bestEl = wrap.querySelector('[data-role="best"]');

    let best = Number(localStorage.getItem('nexus_racer_best') || 0);
    bestEl.textContent = best;

    let lane, traffic, speed, distance, frame, running, rafId, touchStartX;

    function laneX(l) { return l * LANE_W + LANE_W / 2 - CAR_W / 2; }

    function reset() {
      lane = 1;
      traffic = [];
      speed = 3.4;
      distance = 0;
      frame = 0;
      running = true;
      scoreEl.textContent = '0';
    }

    function moveLane(dir) {
      if (!running) { reset(); return; }
      lane = Math.min(LANES - 1, Math.max(0, lane + dir));
    }

    function spawnTraffic() {
      const l = Math.floor(Math.random() * LANES);
      traffic.push({ lane: l, y: -CAR_H });
    }

    function endGame() {
      running = false;
      const meters = Math.floor(distance);
      if (meters > best) {
        best = meters;
        localStorage.setItem('nexus_racer_best', String(best));
        bestEl.textContent = best;
      }
    }

    function update() {
      frame++;
      distance += speed * 0.05;
      speed += 0.002;
      scoreEl.textContent = String(Math.floor(distance));

      if (frame % Math.max(28, Math.floor(60 - speed * 3)) === 0) spawnTraffic();

      traffic.forEach((t) => (t.y += speed * 1.6));
      traffic = traffic.filter((t) => t.y < H + CAR_H);

      const playerY = H - CAR_H - 20;
      traffic.forEach((t) => {
        if (t.lane === lane) {
          const overlap = t.y + CAR_H > playerY && t.y < playerY + CAR_H;
          if (overlap) endGame();
        }
      });
    }

    function drawCar(x, y, color) {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillRect(x, y, CAR_W, CAR_H);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(5,6,11,0.6)';
      ctx.fillRect(x + 6, y + 8, CAR_W - 12, 16);
      ctx.fillRect(x + 6, y + CAR_H - 24, CAR_W - 12, 16);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // lane dividers
      ctx.strokeStyle = 'rgba(0,246,255,0.18)';
      ctx.lineWidth = 2;
      for (let l = 1; l < LANES; l++) {
        ctx.setLineDash([16, 14]);
        ctx.lineDashOffset = -(frame * (speed * 1.6)) % 30;
        ctx.beginPath();
        ctx.moveTo(l * LANE_W, 0);
        ctx.lineTo(l * LANE_W, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // traffic
      traffic.forEach((t) => drawCar(laneX(t.lane), t.y, '#ff2ee6'));

      // player
      drawCar(laneX(lane), H - CAR_H - 20, '#00f6ff');

      if (!running) {
        ctx.fillStyle = 'rgba(5,6,11,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#eaf2ff';
        ctx.font = '16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('COLLISION', W / 2, H / 2 - 10);
        ctx.font = '11px Orbitron, sans-serif';
        ctx.fillStyle = '#8b93ac';
        ctx.fillText('CLICK / TAP TO RESTART', W / 2, H / 2 + 16);
      }
    }

    function loop() {
      if (running) update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function onKey(e) {
      if (e.code === 'ArrowLeft') moveLane(-1);
      if (e.code === 'ArrowRight') moveLane(1);
    }
    function onPointerDown(e) {
      touchStartX = e.clientX;
    }
    function onPointerUp(e) {
      if (touchStartX == null) { if (!running) reset(); return; }
      const dx = e.clientX - touchStartX;
      if (Math.abs(dx) > 24) moveLane(dx > 0 ? 1 : -1);
      else if (!running) reset();
      touchStartX = null;
    }

    document.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);

    reset();
    loop();

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        document.removeEventListener('keydown', onKey);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointerup', onPointerUp);
        wrap.remove();
      },
    };
  }

  let instance = null;
  window.NexusGames = window.NexusGames || {};
  window.NexusGames.cyberRacer = {
    mount(container) { instance = createGame(container); },
    unmount() {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
