/* ==================================================================
   NEXUS ARCADE — Cartridge: Flappy Bird
   Registers itself on window.NexusGames.flappyBird
   ================================================================== */
(() => {
  'use strict';

  const W = 320, H = 420;
  const GRAVITY = 0.45;
  const FLAP = -7.5;
  const PIPE_GAP = 130;
  const PIPE_WIDTH = 46;
  const PIPE_SPEED = 2.4;

  function createGame(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Orbitron,sans-serif;';
    wrap.innerHTML = `
      <div style="font-size:12px;letter-spacing:.08em;color:#00f6ff;text-shadow:0 0 8px rgba(0,246,255,.5);">
        SCORE: <span data-role="score">0</span> &nbsp;|&nbsp; BEST: <span data-role="best">0</span>
      </div>
      <canvas width="${W}" height="${H}" style="background:#0a0d16;border:1px solid rgba(255,46,230,.4);border-radius:10px;box-shadow:0 0 20px rgba(255,46,230,.25);touch-action:manipulation;"></canvas>
      <div style="font-size:11px;color:#8b93ac;">TAP / CLICK / SPACE TO FLAP</div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('[data-role="score"]');
    const bestEl = wrap.querySelector('[data-role="best"]');

    let best = Number(localStorage.getItem('nexus_flappy_best') || 0);
    bestEl.textContent = best;

    let bird, pipes, score, frame, running, rafId;

    function reset() {
      bird = { x: 70, y: H / 2, vy: 0, r: 12 };
      pipes = [];
      score = 0;
      frame = 0;
      running = true;
      scoreEl.textContent = '0';
    }

    function spawnPipe() {
      const topHeight = 40 + Math.random() * (H - PIPE_GAP - 120);
      pipes.push({ x: W, top: topHeight, passed: false });
    }

    function flap() {
      if (!running) { reset(); return; }
      bird.vy = FLAP;
    }

    function endGame() {
      running = false;
      if (score > best) {
        best = score;
        localStorage.setItem('nexus_flappy_best', String(best));
        bestEl.textContent = best;
      }
    }

    function update() {
      frame++;
      bird.vy += GRAVITY;
      bird.y += bird.vy;

      if (frame % 90 === 0) spawnPipe();

      pipes.forEach((p) => (p.x -= PIPE_SPEED));
      while (pipes.length && pipes[0].x < -PIPE_WIDTH) pipes.shift();

      pipes.forEach((p) => {
        if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
          p.passed = true;
          score++;
          scoreEl.textContent = String(score);
        }
        const hitX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH;
        const hitY = bird.y - bird.r < p.top || bird.y + bird.r > p.top + PIPE_GAP;
        if (hitX && hitY) endGame();
      });

      if (bird.y + bird.r > H || bird.y - bird.r < 0) endGame();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // grid backdrop
      ctx.strokeStyle = 'rgba(0,246,255,0.06)';
      for (let gx = 0; gx < W; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // pipes
      pipes.forEach((p) => {
        ctx.fillStyle = 'rgba(255,46,230,0.18)';
        ctx.strokeStyle = '#ff2ee6';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.top);
        ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, H - p.top - PIPE_GAP);
        ctx.strokeRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, H - p.top - PIPE_GAP);
      });

      // bird
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
      ctx.fillStyle = '#00f6ff';
      ctx.shadowColor = '#00f6ff';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!running) {
        ctx.fillStyle = 'rgba(5,6,11,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#eaf2ff';
        ctx.font = '16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
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
      if (e.code === 'Space') { e.preventDefault(); flap(); }
    }

    canvas.addEventListener('pointerdown', flap);
    document.addEventListener('keydown', onKey);

    reset();
    loop();

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('pointerdown', flap);
        document.removeEventListener('keydown', onKey);
        wrap.remove();
      },
    };
  }

  let instance = null;
  window.NexusGames = window.NexusGames || {};
  window.NexusGames.flappyBird = {
    mount(container) { instance = createGame(container); },
    unmount() {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
