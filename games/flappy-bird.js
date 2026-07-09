/* ==================================================================
   NEXUS ARCADE — Cartridge: Flappy Bird (Neon Flappy build)
   Registers itself on window.NexusGames.flappyBird
   Gameplay ported 1:1 from the "Neon Flappy - Fixed Start" HTML build.
   ================================================================== */
(() => {
  'use strict';

  const W = 400, H = 500;

  function createGame(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Orbitron,sans-serif;';
    wrap.innerHTML = `
      <div style="font-size:12px;letter-spacing:.08em;color:#00f2fe;text-shadow:0 0 8px rgba(0,242,254,.5);">
        BEST: <span data-role="best">0</span>
      </div>
      <canvas width="${W}" height="${H}" style="background:#0f0e17;border-radius:15px;box-shadow:0 0 35px rgba(255,0,128,.3);max-width:95%;touch-action:manipulation;"></canvas>
      <div style="font-size:11px;color:#8b93ac;">TAP / CLICK / SPACE TO FLY</div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const bestEl = wrap.querySelector('[data-role="best"]');

    let best = Number(localStorage.getItem('nexus_flappy_best') || 0);
    bestEl.textContent = best;

    // ---- Game state (same rules as the original Neon Flappy build) ----
    let score = 0;
    let gameActive = false;
    let gameStarted = false;

    let bird = { x: 80, y: 250, size: 14, gravity: 0.4, velocity: 0, jump: -7 };

    let pipes = [];
    const pipeWidth = 55;
    const pipeGap = 150;
    const baseSpeed = 3;
    const maxSpeed = 7.5;
    const speedPerPoint = 0.15;
    let pipeSpeed = baseSpeed;
    let frameCount = 0;

    let stars = [];
    let particles = [];
    let rafId = null;

    for (let i = 0; i < 30; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 });
    }

    function createExplosion(x, y) {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 4 + 1,
          alpha: 1,
        });
      }
    }

    function update() {
      if (!gameActive) return;

      frameCount++;

      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      if (bird.y + bird.size >= canvas.height || bird.y - bird.size <= 0) {
        gameOver();
      }

      if (frameCount % 100 === 0) {
        const minHeight = 50;
        const maxHeight = canvas.height - pipeGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipes.push({ x: canvas.width, top: topHeight, passed: false });
      }

      pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;

        if (bird.x + bird.size > pipe.x && bird.x - bird.size < pipe.x + pipeWidth) {
          if (bird.y - bird.size < pipe.top || bird.y + bird.size > pipe.top + pipeGap) {
            gameOver();
          }
        }

        if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
          score++;
          pipe.passed = true;
          pipeSpeed = Math.min(maxSpeed, baseSpeed + score * speedPerPoint);
        }

        if (pipe.x + pipeWidth < 0) {
          pipes.splice(index, 1);
        }
      });

      particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(index, 1);
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      stars.forEach((star) => ctx.fillRect(star.x, star.y, star.size, star.size));

      pipes.forEach((pipe) => {
        let topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        topGrad.addColorStop(0, '#00f2fe'); topGrad.addColorStop(1, '#4facfe');
        ctx.fillStyle = topGrad;
        ctx.shadowBlur = 15; ctx.shadowColor = '#00f2fe';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);

        let bottomGrad = ctx.createLinearGradient(pipe.x, pipe.top + pipeGap, pipe.x + pipeWidth, 0);
        bottomGrad.addColorStop(0, '#00f2fe'); bottomGrad.addColorStop(1, '#4facfe');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - (pipe.top + pipeGap));
      });

      ctx.fillStyle = '#ff007f';
      ctx.shadowBlur = 20; ctx.shadowColor = '#ff007f';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
      ctx.fill();

      particles.forEach((p) => {
        ctx.fillStyle = `rgba(255, 0, 127, ${p.alpha})`;
        ctx.shadowBlur = 0;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';

      if (!gameStarted) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#00f2fe';
        ctx.fillText('TAP TO START 🎮', canvas.width / 2 - 90, canvas.height / 2);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Ball will fly when you touch', canvas.width / 2 - 85, canvas.height / 2 + 30);
      } else {
        ctx.font = 'bold 20px Arial';
        ctx.fillText('SCORE: ' + score, 20, 40);
      }
    }

    function gameOver() {
      gameActive = false;
      gameStarted = false;
      createExplosion(bird.x, bird.y);

      if (score > best) {
        best = score;
        localStorage.setItem('nexus_flappy_best', String(best));
        bestEl.textContent = best;
      }

      setTimeout(() => {
        alert('🎮 Game Over!\nYour Score: ' + score);
        resetGame();
      }, 150);
    }

    function resetGame() {
      bird.y = 250; bird.velocity = 0;
      pipes = []; score = 0; pipeSpeed = baseSpeed; frameCount = 0;
      gameActive = false;
      gameStarted = false;
    }

    function flap() {
      if (!gameStarted) {
        gameStarted = true;
        gameActive = true;
      }
      if (gameActive) {
        bird.velocity = bird.jump;
      }
    }

    function onKey(e) {
      if (e.code === 'Space') { e.preventDefault(); flap(); }
    }

    function loop() {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    canvas.addEventListener('pointerdown', flap);
    document.addEventListener('keydown', onKey);

    resetGame();
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
