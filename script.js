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
