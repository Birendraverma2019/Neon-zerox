/* ==================================================================
   NEXUS ARCADE — Core Application Script
   Sections:
   1. Sidebar / Navbar interaction
   2. GAME_REGISTRY — single source of truth for every cartridge
   3. Card renderer — builds the grid from the registry
   4. Game Engine / Manager — lazy-loads each game's own <script> file
      on demand, mounts it into the Game Stage, and tears it down
      cleanly on close so nothing keeps running in the background.
   ================================================================== */

(() => {
  'use strict';

  /* ----------------------------------------------------------------
     1. SIDEBAR / NAVBAR
     ---------------------------------------------------------------- */
  const sidebar         = document.getElementById('sidebar');
  const sidebarToggle   = document.getElementById('sidebarToggle');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    sidebar.classList.add('is-open');
    sidebarBackdrop.classList.add('is-visible');
    sidebarToggle.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    sidebarBackdrop.classList.remove('is-visible');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleSidebar() {
    sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
  }

  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarBackdrop.addEventListener('click', closeSidebar);

  // Close sidebar after choosing a link (mobile-friendly) and on Escape.
  sidebar.querySelectorAll('.sidebar__link').forEach((link) => {
    link.addEventListener('click', () => closeSidebar());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  /* ----------------------------------------------------------------
     2. GAME_REGISTRY
     ----------------------------------------------------------------
     Single config object driving both the card grid and the loader.
     To add a new game later: drop its file in /games/, then add one
     entry here. Nothing else in the app needs to change.

     Each entry:
       id        — unique key, also used as the DOM/script identifier
       title     — display name on the card
       subtitle  — short futuristic blurb
       accent    — 'cyan' | 'magenta' | 'lime' (cycles the neon palette)
       src       — path to the game's independent script file
       globalKey — the key the game registers itself under on
                   `window.NexusGames` once its script has loaded
     ---------------------------------------------------------------- */
  const GAME_REGISTRY = [
    {
      id: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      subtitle: 'Classic grid warfare, rebuilt in neon.',
      accent: 'cyan',
      src: 'games/tic-tac-toe.js',
      globalKey: 'ticTacToe',
    },
    {
      id: 'flappy-bird',
      title: 'Flappy Bird',
      subtitle: 'One tap. Infinite regret. Try again.',
      accent: 'magenta',
      src: 'games/flappy-bird.js',
      globalKey: 'flappyBird',
    },
    {
      id: 'box-runner',
      title: 'Box Runner',
      subtitle: 'Dodge the grid. Outrun the glitch.',
      accent: 'lime',
      src: 'games/box-runner.js',
      globalKey: 'boxRunner',
    },
    {
      id: 'cyber-racer',
      title: 'Cyber Racer',
      subtitle: 'Three lanes. Zero mercy. Full throttle.',
      accent: 'cyan',
      src: 'games/cyber-racer.js',
      globalKey: 'cyberRacer',
    },
    {
      id: 'neon-brick-breaker',
      title: 'Neon Brick Breaker',
      subtitle: 'Shatter the wall, one glowing brick at a time.',
      accent: 'magenta',
      src: 'games/neon-brick-breaker.js',
      globalKey: 'neonBrickBreaker',
    },
    {
      id: 'metro-dash',
      title: 'Metro Dash 3D',
      subtitle: 'Dodge trains, dodge cops, chase the high score.',
      accent: 'cyan',
      src: 'games/metro-dash.js',
      globalKey: 'metroDash',
    },
    {
      id: 'subway-surfers',
      title: 'Subway Surfers',
      subtitle: 'Sprint the tracks, swipe past the inspector.',
      accent: 'magenta',
      src: 'games/subway-surfers.js',
      globalKey: 'subwaySurfers',
    },
    {
      id: 'temple-run',
      title: 'Temple Run',
      subtitle: 'Outrun the curse. One wrong turn, game over.',
      accent: 'lime',
      src: 'games/temple-run.js',
      globalKey: 'templeRun',
    },
    {
      id: 'candy-crush',
      title: 'Candy Crush',
      subtitle: 'Match three, chain combos, sweet chaos.',
      accent: 'magenta',
      src: 'games/candy-crush.js',
      globalKey: 'candyCrush',
    },
    {
      id: '2048',
      title: '2048',
      subtitle: 'Slide the tiles, merge your way to victory.',
      accent: 'cyan',
      src: 'games/2048.js',
      globalKey: 'twentyFortyEight',
    },
    {
      id: 'fruit-ninja',
      title: 'Fruit Ninja',
      subtitle: 'Slice fast, dodge bombs, chase the streak.',
      accent: 'lime',
      src: 'games/fruit-ninja.js',
      globalKey: 'fruitNinja',
    },
    {
      id: 'angry-birds',
      title: 'Angry Birds',
      subtitle: 'Sling, smash, and topple the pig fortress.',
      accent: 'magenta',
      src: 'games/angry-birds.js',
      globalKey: 'angryBirds',
    },
    {
      id: 'snake',
      title: 'Snake',
      subtitle: 'Eat, grow, don\'t bite your own tail.',
      accent: 'lime',
      src: 'games/snake.js',
      globalKey: 'snake',
    },
    {
      id: 'chess',
      title: 'Chess',
      subtitle: 'Sixty-four squares. One winner. Pure strategy.',
      accent: 'cyan',
      src: 'games/chess.js',
      globalKey: 'chess',
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      subtitle: 'Nine grids, one logic puzzle to crack.',
      accent: 'magenta',
      src: 'games/sudoku.js',
      globalKey: 'sudoku',
    },
    {
      id: 'wordle',
      title: 'Wordle',
      subtitle: 'Six guesses to crack the hidden word.',
      accent: 'lime',
      src: 'games/wordle.js',
      globalKey: 'wordle',
    },
    {
      id: 'minesweeper',
      title: 'Minesweeper',
      subtitle: 'Clear the grid, avoid the hidden mines.',
      accent: 'cyan',
      src: 'games/minesweeper.js',
      globalKey: 'minesweeper',
    },
    {
      id: 'tetris',
      title: 'Tetris',
      subtitle: 'Stack the blocks, clear the lines, survive.',
      accent: 'magenta',
      src: 'games/tetris.js',
      globalKey: 'tetris',
    },
    {
      id: 'pac-man',
      title: 'Pac-Man',
      subtitle: 'Munch the dots, dodge the ghosts.',
      accent: 'lime',
      src: 'games/pac-man.js',
      globalKey: 'pacMan',
    },
    {
      id: 'crossy-road',
      title: 'Crossy Road',
      subtitle: 'Hop the lanes, dodge the traffic, don\'t stop.',
      accent: 'cyan',
      src: 'games/crossy-road.js',
      globalKey: 'crossyRoad',
    },
    {
      id: 'stack-tower',
      title: 'Stack Tower',
      subtitle: 'Time your drop, stack it high, don\'t miss.',
      accent: 'magenta',
      src: 'games/stack-tower.js',
      globalKey: 'stackTower',
    },
    {
      id: 'geometry-dash',
      title: 'Geometry Dash',
      subtitle: 'Jump the spikes, ride the beat, don\'t crash.',
      accent: 'lime',
      src: 'games/geometry-dash.js',
      globalKey: 'geometryDash',
    },
    {
      id: 'doodle-jump',
      title: 'Doodle Jump',
      subtitle: 'Bounce higher, dodge the drops, reach the sky.',
      accent: 'cyan',
      src: 'games/doodle-jump.js',
      globalKey: 'doodleJump',
    },
    {
      id: '8-ball-pool',
      title: '8 Ball Pool',
      subtitle: 'Line the shot, sink the ball, run the table.',
      accent: 'magenta',
      src: 'games/8-ball-pool.js',
      globalKey: 'eightBallPool',
    },
    {
      id: 'solitaire',
      title: 'Solitaire',
      subtitle: 'Classic cards, one deck, one quiet win.',
      accent: 'lime',
      src: 'games/solitaire.js',
      globalKey: 'solitaire',
    },
  ];

  /* ----------------------------------------------------------------
     3. CARD RENDERER
     ---------------------------------------------------------------- */
  const gameGrid = document.getElementById('gameGrid');

  // A tiny inline icon set so each thumbnail feels distinct with zero
  // image requests (keeps the grid fast and dependency-free).
  const THUMB_ICONS = {
    'tic-tac-toe': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" stroke-width="1.4"/></svg>',
    'flappy-bird': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M3 13c3-4 6-5 9-3 2 1.3 3.5 1 6-1M14 6l4 1-1 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="9" r="1.1" fill="currentColor"/></svg>',
    'box-runner': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="4" y="10" width="6" height="6" stroke="currentColor" stroke-width="1.4"/><path d="M13 13h7M17 9l3 4-3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'cyber-racer': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M4 4v16M12 4v16M20 4v16" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3"/><path d="M9 6l3-2 3 2M9 18l3 2 3-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'neon-brick-breaker': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="5" width="6" height="3" stroke="currentColor" stroke-width="1.3"/><rect x="10" y="5" width="6" height="3" stroke="currentColor" stroke-width="1.3"/><rect x="17" y="5" width="4" height="3" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="14" r="1.3" fill="currentColor"/><rect x="9" y="19" width="6" height="1.6" fill="currentColor"/></svg>',
    'metro-dash': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M4 20l4-6 3 3 4-7 5 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><rect x="3" y="20" width="18" height="1.6" fill="currentColor"/></svg>',
    'subway-surfers': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M4 4v16M12 4v16M20 4v16" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M8 10v5M6 12h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    'temple-run': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M4 20l6-14 6 14M8 14h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 9l4 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    'candy-crush': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="15" y="3" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="15" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/></svg>',
    '2048': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="3" width="8" height="8" stroke="currentColor" stroke-width="1.3"/><rect x="13" y="3" width="8" height="8" stroke="currentColor" stroke-width="1.3"/><rect x="3" y="13" width="8" height="8" stroke="currentColor" stroke-width="1.3"/><rect x="13" y="13" width="8" height="8" stroke="currentColor" stroke-width="1.3"/></svg>',
    'fruit-ninja': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M4 20L20 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/><circle cx="17" cy="17" r="2" stroke="currentColor" stroke-width="1.3"/></svg>',
    'angry-birds': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><circle cx="8" cy="12" r="4" stroke="currentColor" stroke-width="1.3"/><path d="M12 12h6M15 9l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'snake': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M4 8h6v6H4V8zM10 14h6v-6h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19" cy="8" r="1.2" fill="currentColor"/></svg>',
    'chess': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M9 20h6M10 20l-1-6h6l-1 6M8 14l1-3h6l1 3M11 11V6M9 6h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'sudoku': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="3" width="18" height="18" stroke="currentColor" stroke-width="1.3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" stroke-width="0.9"/></svg>',
    'wordle': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="2" y="9" width="4.5" height="6" stroke="currentColor" stroke-width="1.2"/><rect x="7.5" y="9" width="4.5" height="6" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.25"/><rect x="13" y="9" width="4.5" height="6" stroke="currentColor" stroke-width="1.2"/><rect x="18.5" y="9" width="4.5" height="6" stroke="currentColor" stroke-width="1.2"/></svg>',
    'minesweeper': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
    'tetris': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="4" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="13" y="14" width="5" height="5" stroke="currentColor" stroke-width="1.3"/></svg>',
    'pac-man': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M21 12A9 9 0 1 1 12.5 3l8.5 9-8.5 0z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="18" cy="6" r="1" fill="currentColor"/></svg>',
    'crossy-road': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.1" stroke-dasharray="2 2"/><rect x="10" y="3" width="4" height="4" stroke="currentColor" stroke-width="1.3"/></svg>',
    'stack-tower': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="7" y="17" width="10" height="3" stroke="currentColor" stroke-width="1.3"/><rect x="5" y="12" width="14" height="3" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="7" width="8" height="3" stroke="currentColor" stroke-width="1.3"/></svg>',
    'geometry-dash': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="14" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><path d="M11 19l5-10 5 10z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    'doodle-jump': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M6 15h4M14 19h4M4 20h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    '8-ball-pool': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><circle cx="9" cy="12" r="5" stroke="currentColor" stroke-width="1.3"/><text x="9" y="15" font-size="6" fill="currentColor" text-anchor="middle" font-family="sans-serif">8</text><path d="M15 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    'solitaire': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-card__thumb-icon"><rect x="3" y="4" width="8" height="12" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="13" y="8" width="8" height="12" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>',
  };

  function renderGameCards(registry) {
    const fragment = document.createDocumentFragment();

    registry.forEach((game, index) => {
      const card = document.createElement('article');
      card.className = 'game-card';
      card.dataset.accent = game.accent;

      card.innerHTML = `
        <div class="game-card__thumb">
          <span class="game-card__id">CART_${String(index + 1).padStart(2, '0')}</span>
          ${THUMB_ICONS[game.id] || ''}
          <span class="game-card__thumb-scan" aria-hidden="true"></span>
        </div>
        <div class="game-card__body">
          <h3 class="game-card__title">${game.title}</h3>
          <p class="game-card__subtitle">${game.subtitle}</p>
          <button type="button" class="game-card__launch" data-game-id="${game.id}">
            &#9658; Launch Game
          </button>
        </div>
      `;

      fragment.appendChild(card);
    });

    gameGrid.appendChild(fragment);
  }

  /* ----------------------------------------------------------------
     4. GAME ENGINE / MANAGER
     ----------------------------------------------------------------
     - Loads at most one game script at a time.
     - Caches loaded scripts so re-launching the same game is instant.
     - Mounts/unmounts through a tiny contract every game file follows:

         window.NexusGames.<globalKey> = {
           mount(container)   -> called when the game should start
           unmount(container) -> called when the stage is closed
         }
     ---------------------------------------------------------------- */
  window.NexusGames = window.NexusGames || {};

  const stage       = document.getElementById('gameStage');
  const stageTitle  = document.getElementById('gameStageTitle');
  const stageBody   = document.getElementById('gameStageBody');
  const stageClose  = document.getElementById('gameStageClose');

  const loadedScripts = new Set(); // src values already injected into the DOM
  let activeGame = null;           // the registry entry currently mounted

  function showLoader() {
    stageBody.innerHTML = `
      <div class="stage-loader">
        <span class="stage-loader__spinner" aria-hidden="true"></span>
        <span>LOADING CARTRIDGE&hellip;</span>
      </div>
    `;
  }

  function showError(message) {
    stageBody.innerHTML = `<p class="stage-error">${message}</p>`;
  }

  /**
   * Dynamically injects a <script> tag for the requested game, exactly
   * once per session. Returns a Promise that resolves once the game
   * has registered itself on window.NexusGames.
   */
  function loadGameScript(game) {
    return new Promise((resolve, reject) => {
      // Already loaded & registered — skip straight to resolve.
      if (loadedScripts.has(game.src) && window.NexusGames[game.globalKey]) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = game.src;
      script.defer = true;
      script.dataset.gameId = game.id;

      script.onload = () => {
        loadedScripts.add(game.src);
        if (window.NexusGames[game.globalKey]) {
          resolve();
        } else {
          reject(new Error(`"${game.title}" loaded but did not register correctly.`));
        }
      };

      script.onerror = () => {
        reject(new Error(`Could not load "${game.title}". Check the file path: ${game.src}`));
      };

      document.body.appendChild(script);
    });
  }

  async function launchGame(gameId) {
    const game = GAME_REGISTRY.find((g) => g.id === gameId);
    if (!game) return;

    activeGame = game;
    stageTitle.textContent = game.title.toUpperCase();
    stage.hidden = false;
    document.body.style.overflow = 'hidden';
    showLoader();

    try {
      await loadGameScript(game);
      stageBody.innerHTML = ''; // clear loader
      const mountPoint = document.createElement('div');
      mountPoint.className = 'game-mount';
      mountPoint.style.width = '100%';
      stageBody.appendChild(mountPoint);
      window.NexusGames[game.globalKey].mount(mountPoint);
    } catch (err) {
      showError(err.message || 'Something went wrong loading this cartridge.');
      // eslint-disable-next-line no-console
      console.error('[NexusArcade]', err);
    }
  }

  function closeStage() {
    if (activeGame && window.NexusGames[activeGame.globalKey]?.unmount) {
      try {
        window.NexusGames[activeGame.globalKey].unmount(stageBody);
      } catch (err) {
        console.error('[NexusArcade] Error during unmount:', err);
      }
    }
    stage.hidden = true;
    stageBody.innerHTML = '';
    document.body.style.overflow = '';
    activeGame = null;
  }

  // Event delegation: one listener handles all current AND future cards.
  gameGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-game-id]');
    if (btn) launchGame(btn.dataset.gameId);
  });

  stageClose.addEventListener('click', closeStage);
  stage.addEventListener('click', (e) => {
    if (e.target === stage) closeStage(); // click outside panel
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !stage.hidden) closeStage();
  });

  /* ----------------------------------------------------------------
     INIT
     ---------------------------------------------------------------- */
  renderGameCards(GAME_REGISTRY);
  document.getElementById('year').textContent = new Date().getFullYear();
})();
