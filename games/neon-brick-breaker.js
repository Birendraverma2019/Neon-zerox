/* ==================================================================
   NEXUS ARCADE — Cartridge: Neon Brick Breaker
   Registers itself on window.NexusGames.neonBrickBreaker
   ================================================================== */
(() => {
  'use strict';

  const W = 320, H = 420;
  const PADDLE_W = 64, PADDLE_H = 10;
  const BALL_R = 6;
  const ROWS = 4, COLS = 7;
  const BRICK_W = W / COLS, BRICK_H = 16;
  const COLORS = ['#00f6ff', '#b6ff2a', '#ff2ee6', '#00f6ff'];

  function createGame(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Orbitron,sans-serif;';
    wrap.innerHTML = `
      <div style="font-size:12px;letter-spacing:.08em;color:#ff2ee6;text-shadow:0 0 8px rgba(255,46,230,.5);">
        SCORE: <span data-role="score">0</span> &nbsp;|&nbsp; LIVES: <span data-role="lives">3</span>
      </div>
      <canvas width="${W}" height="${H}" style="background:#0a0d16;border:1px solid rgba(255,46,230,.4);border-radius:10px;box-shadow:0 0 20px rgba(255,46,230,.2);touch-action:none;"></canvas>
      <div style="font-size:11px;color:#8b93ac;">MOVE MOUSE / DRAG TO STEER THE PADDLE</div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = wrap.querySelector('[data-role="score"]');
    const livesEl = wrap.querySelector('[data-role="lives"]');

    let paddle, ball, bricks, score, lives, running, rafId;

    function buildBricks() {
      const arr = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          arr.push({ x: c * BRICK_W, y: 30 + r * BRICK_H, w: BRICK_W - 4, h: BRICK_H - 4, alive: true, color: COLORS[r % COLORS.length] });
        }
      }
      return arr;
    }

    function resetBall() {
      ball = { x: W / 2, y: H - 60, vx: 3, vy: -3.4, r: BALL_R };
    }

    function reset() {
      paddle = { x: W / 2 - PADDLE_W / 2, y: H - 24 };
      bricks = buildBricks();
      score = 0;
      lives = 3;
      running = true;
      scoreEl.textContent = '0';
      livesEl.textContent = '3';
      resetBall();
    }

    function movePaddleTo(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      paddle.x = Math.min(W - PADDLE_W, Math.max(0, x - PADDLE_W / 2));
    }

    function endGame(won) {
      running = false;
      finalMessage = won ? 'WALL CLEARED!' : 'OUT OF LIVES';
    }
    let finalMessage = '';

    function update() {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
      if (ball.y - ball.r < 0) ball.vy *= -1;

      // paddle collision
      if (
        ball.y + ball.r > paddle.y &&
        ball.y + ball.r < paddle.y + PADDLE_H + 6 &&
        ball.x > paddle.x &&
        ball.x < paddle.x + PADDLE_W &&
        ball.vy > 0
      ) {
        const hitPos = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
        ball.vx = hitPos * 4.5;
        ball.vy = -Math.abs(ball.vy);
      }

      // brick collisions
      bricks.forEach((b) => {
        if (!b.alive) return;
        const hit =
          ball.x + ball.r > b.x &&
          ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y &&
          ball.y - ball.r < b.y + b.h;
        if (hit) {
          b.alive = false;
          ball.vy *= -1;
          score += 10;
          scoreEl.textContent = String(score);
        }
      });

      if (bricks.every((b) => !b.alive)) endGame(true);

      if (ball.y - ball.r > H) {
        lives--;
        livesEl.textContent = String(Math.max(lives, 0));
        if (lives <= 0) {
          endGame(false);
        } else {
          resetBall();
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color + '33';
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(b.x + 2, b.y, b.w, b.h);
        ctx.strokeRect(b.x + 2, b.y, b.w, b.h);
      });

      ctx.fillStyle = '#00f6ff';
      ctx.shadowColor = '#00f6ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H);
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff2ee6';
      ctx.shadowColor = '#ff2ee6';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!running) {
        ctx.fillStyle = 'rgba(5,6,11,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#eaf2ff';
        ctx.font = '16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(finalMessage, W / 2, H / 2 - 10);
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

    function onPointerMove(e) {
      if (running) movePaddleTo(e.clientX);
    }
    function onPointerDown(e) {
      if (!running) reset();
      else movePaddleTo(e.clientX);
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);

    reset();
    loop();

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
        wrap.remove();
      },
    };
  }

  let instance = null;
  window.NexusGames = window.NexusGames || {};
  window.NexusGames.neonBrickBreaker = {
    mount(container) { instance = createGame(container); },
    unmount() {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
