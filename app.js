/* VISHN0O // SPECIMEN WORKBENCH — Fluid Multi-Device & Touch-Aware Edition */
(() => {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const isTouchDevice = () =>
    (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
    ('ontouchstart' in window);

  /* ---------- 1. Mechanical Web Audio Synthesizer (Optional SFX: OFF by default) ---------- */
  let sfxEnabled = false;
  let audioCtx = null;
  const sfxToggleBtn = document.getElementById('sfx-toggle');
  const sfxLabelEl = document.getElementById('sfx-label');

  const playMechanicalClick = (freq = 1650, duration = 0.014, gainVal = 0.045) => {
    if (!sfxEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextCls = window.AudioContext || window.webkitAudioContext;
        if (AudioContextCls) audioCtx = new AudioContextCls();
      }
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + duration);

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  };

  const playCatChime = () => {
    if (!sfxEnabled) return;
    playMechanicalClick(880, 0.07, 0.05);
    setTimeout(() => playMechanicalClick(1320, 0.09, 0.045), 75);
  };

  const toggleSfx = () => {
    sfxEnabled = !sfxEnabled;
    if (sfxToggleBtn) sfxToggleBtn.setAttribute('aria-pressed', String(sfxEnabled));
    if (sfxLabelEl) sfxLabelEl.textContent = sfxEnabled ? 'SFX:ON' : 'SFX:OFF';
    if (sfxEnabled) playMechanicalClick(1900, 0.018, 0.06);
  };

  if (sfxToggleBtn) sfxToggleBtn.addEventListener('click', toggleSfx);

  /* ---------- 2. Dual Theme Switcher with Circular View Transitions Ripple ---------- */
  const htmlEl = document.documentElement;
  const themeMeta = document.getElementById('theme-meta');
  const toggleBtn = document.getElementById('theme-toggle');

  const applyTheme = (mode, persist = true) => {
    htmlEl.setAttribute('data-theme', mode);
    themeMeta.setAttribute('content', mode === 'dark' ? '#0B0C0E' : '#F2F0EA');
    toggleBtn.querySelectorAll('.opt').forEach((el) => {
      el.classList.toggle('active', el.dataset.mode === mode);
    });
    if (persist) {
      try { localStorage.setItem('vishn0o_theme', mode); } catch (_) {}
    }
  };

  const initTheme = () => {
    let saved = null;
    try { saved = localStorage.getItem('vishn0o_theme'); } catch (_) {}
    if (saved === 'dark' || saved === 'paper') {
      applyTheme(saved, false);
      return;
    }
    const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(osPrefersDark ? 'dark' : 'paper', false);
  };

  initTheme();

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      let saved = null;
      try { saved = localStorage.getItem('vishn0o_theme'); } catch (_) {}
      if (!saved) applyTheme(e.matches ? 'dark' : 'paper', false);
    });
  }

  const toggleTheme = (originEvent = null) => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'paper' : 'dark';
    playMechanicalClick(next === 'dark' ? 1200 : 1750, 0.02, 0.055);

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next, true);
      return;
    }

    const rect = toggleBtn.getBoundingClientRect();
    const x = originEvent && typeof originEvent.clientX === 'number' && originEvent.clientX > 0
      ? originEvent.clientX
      : rect.left + rect.width / 2;
    const y = originEvent && typeof originEvent.clientY === 'number' && originEvent.clientY > 0
      ? originEvent.clientY
      : rect.top + rect.height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      applyTheme(next, true);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 420,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    }).catch(() => {});
  };

  toggleBtn.addEventListener('click', (e) => toggleTheme(e));

  /* ---------- 3. Live IST Clock, Portrait Touch Toggle & Pointer Effects ---------- */
  const clockEl = document.getElementById('live-clock');
  const updateClock = () => {
    const now = new Date();
    const ist = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now);
    clockEl.textContent = `MANIPAL · ${ist} IST`;
  };
  updateClock();
  setInterval(updateClock, 1000);

  const portraitToggle = document.getElementById('portrait-toggle');
  if (portraitToggle) {
    portraitToggle.addEventListener('click', () => {
      playMechanicalClick(1700, 0.012, 0.04);
      portraitToggle.classList.toggle('color-active');
    });
  }

  const coordEl = document.getElementById('coord-readout');
  const stageEl = document.getElementById('specimen-stage');
  const reticleEl = document.getElementById('stage-reticle');

  if (coordEl && stageEl && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      const rect = stageEl.getBoundingClientRect();
      const insideStage =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (insideStage) {
        const rx = Math.round(e.clientX - rect.left);
        const ry = Math.round(e.clientY - rect.top);
        coordEl.textContent = `STAGE X:${String(rx).padStart(3, '0')} Y:${String(ry).padStart(3, '0')}`;
        if (reticleEl) {
          reticleEl.classList.add('active');
          reticleEl.style.transform = `translate3d(${e.clientX - 12}px, ${e.clientY - 12}px, 0)`;
        }
        return;
      }

      if (reticleEl) reticleEl.classList.remove('active');
      const hoveredZone = e.target && e.target.closest ? e.target.closest('[data-hud-label]') : null;
      coordEl.textContent = hoveredZone ? hoveredZone.dataset.hudLabel : 'VIEW // IDLE';
    }, { passive: true });
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.14;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- 4. Mobile / Tablet Bottom Dock Scroll-Spy ---------- */
  const dockLinks = document.querySelectorAll('#mobile-dock .dock-link');
  if (dockLinks.length && 'IntersectionObserver' in window) {
    const sectionIds = ['thesis', 'workbench', 'telemetry-foot', 'signal'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          dockLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === activeId);
          });
        }
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0.01 });

    sections.forEach((sec) => spyObserver.observe(sec));
  }

  /* ---------- 5. Modern Clipboard Helper with Graceful Fallback ---------- */
  const copyTextToClipboard = async (text, triggerBtn, defaultLabel) => {
    playMechanicalClick(1800, 0.015, 0.05);
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (_) {}
    }
    if (!copied) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.className = 'sr-copy-buffer';
      document.body.appendChild(ta);
      ta.select();
      try {
        copied = document.execCommand('copy');
      } catch (_) {}
      document.body.removeChild(ta);
    }
    if (triggerBtn) {
      triggerBtn.textContent = copied ? 'COPIED TO CLIPBOARD ✓' : text;
      setTimeout(() => { triggerBtn.textContent = defaultLabel; }, 2200);
    }
  };

  /* ---------- 6. Rich Interactive Artifact Sandboxes ---------- */
  const INKY_FACTS = [
    {
      kicker: 'WIKIPEDIA TRIVIA · CACHED IN ROOM',
      title: 'The Great Emu War (1932)',
      body: 'Royal Australian Artillery soldiers deployed with Lewis machine guns in Western Australia failed to curb the emu population.'
    },
    {
      kicker: 'ENGINEERING HISTORY · OFFLINE ARCHIVE',
      title: 'Apollo Guidance Computer Rope Memory',
      body: 'Mission software was physically woven by hand using copper wires threaded through or around magnetic ferrite cores.'
    },
    {
      kicker: 'SYSTEMS LORE · DAILY QUIZ POOL',
      title: 'The 1970 Unix Epoch Origin',
      body: 'Unix time counts seconds since 00:00:00 UTC on 1 January 1970—chosen as a clean, recent round date by early Bell Labs engineers.'
    },
    {
      kicker: 'NATURAL SCIENCE · BOOKMARKED FACT',
      title: 'Voyager 1 Golden Record',
      body: 'Launched in 1977, Voyager 1 carries a gold-plated copper phonograph record encoded with 115 analog images and greetings in 55 languages.'
    }
  ];

  const KATHA_SHELF_BOOKS = [
    { lang: 'MALAYALAM // LOCAL SQLITE', title: 'ഖസാക്കിന്റെ ഇതിഹാസം', ml: true, meta: 'ഒ.വി. വിജയൻ · ★★★★★ · 100% READ' },
    { lang: 'ENGLISH // LOCAL SQLITE', title: 'The Design of Everyday Things', ml: false, meta: 'Don Norman · ★★★★½ · READING (68%)' },
    { lang: 'MALAYALAM // LOCAL SQLITE', title: 'രണ്ടാമൂഴം', ml: true, meta: 'എം.ടി. വാസുദേവൻ നായർ · ★★★★★ · 100% READ' },
    { lang: 'ENGLISH // LOCAL SQLITE', title: 'Designing Data-Intensive Applications', ml: false, meta: 'Martin Kleppmann · ★★★★★ · READING (42%)' }
  ];

  const ARTIFACT_RENDERERS = {
    'widget-switcher': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>LIVE WIDGET SANDBOX // 5 STYLES × 3 SIZES</span>
          <span>TAP FACT TO CYCLE OFFLINE ARCHIVE</span>
        </div>
        <div class="artifact-controls-bar">
          <div class="pill-row" id="inky-styles">
            <button type="button" class="mini-pill active" data-style="eink">E-Ink</button>
            <button type="button" class="mini-pill" data-style="swiss">Swiss</button>
            <button type="button" class="mini-pill" data-style="glass">Glass</button>
            <button type="button" class="mini-pill" data-style="dot">Dot</button>
            <button type="button" class="mini-pill" data-style="almanac">Almanac</button>
          </div>
          <div class="pill-row" id="inky-sizes">
            <button type="button" class="mini-pill active" data-size="4x2">4×2</button>
            <button type="button" class="mini-pill" data-size="3x2">3×2</button>
            <button type="button" class="mini-pill" data-size="4x3">4×3</button>
          </div>
        </div>
        <div class="inky-stage-wrap">
          <div class="inky-preview style-eink size-4x2" id="inky-card">
            <div class="inky-top-row">
              <div class="inky-kicker" id="inky-kicker">${esc(INKY_FACTS[0].kicker)}</div>
              <button type="button" class="inky-cycle-btn" id="inky-next-fact">NEXT FACT ↻ (1/4)</button>
            </div>
            <div class="inky-heading" id="inky-heading">${esc(INKY_FACTS[0].title)}</div>
            <div class="inky-body" id="inky-body">${esc(INKY_FACTS[0].body)}</div>
          </div>
        </div>
      </section>`,

    'bilingual-shelf': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>THALIR (തളിർ) BILINGUAL SHELF SANDBOX</span>
          <span>BUNDLED MANJARI + LORA · ZERO NETWORK</span>
        </div>
        <div class="katha-toolbar">
          <div class="pill-row" id="katha-filters">
            <button type="button" class="mini-pill active" data-filter="ALL">All (4)</button>
            <button type="button" class="mini-pill" data-filter="MALAYALAM">മലയാളം (2)</button>
            <button type="button" class="mini-pill" data-filter="ENGLISH">English (2)</button>
          </div>
          <button type="button" class="mini-pill accent-pill" id="katha-surprise">🎲 SURPRISE-ME PICK</button>
        </div>
        <div class="katha-grid" id="katha-grid">
          ${KATHA_SHELF_BOOKS.map((b, i) => `
            <div class="katha-book" data-book-idx="${i}">
              <div class="katha-lang">${esc(b.lang)}</div>
              <div class="katha-title ${b.ml ? 'ml' : ''}">${esc(b.title)}</div>
              <div class="katha-meta">${esc(b.meta)}</div>
            </div>
          `).join('')}
        </div>
      </section>`,

    'sm2-demo': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>SM-2 SPACED REPETITION &amp; BLIND-RECALL SANDBOX</span>
          <span>CONFIDENCE-WEIGHTED SCORING</span>
        </div>
        <div class="sm2-panel">
          <div class="sm2-top">
            <div class="sm2-q">Q: Why does SQLite WAL mode improve concurrent local reads?</div>
            <button type="button" class="mini-pill" id="sm2-blind-toggle">👁 BLIND RECALL: OFF</button>
          </div>
          <div class="sm2-a" id="sm2-answer">Readers do not block writers and writers do not block readers because changes append to a separate write-ahead log.</div>
          <div class="pill-row" id="sm2-actions">
            <button type="button" class="mini-pill" data-rate="AGAIN → Relearn in 10 mins (0× marks · Ease -0.20)">Again (10m)</button>
            <button type="button" class="mini-pill" data-rate="FUZZY → Next review in 1 day (0.5× marks · Ease -0.15)">Fuzzy (1d)</button>
            <button type="button" class="mini-pill" data-rate="GOOD → Next review in 3 days (1.0× marks · Ease +0.00)">Good (3d)</button>
          </div>
          <div class="sm2-status" id="sm2-status">RATE RECALL ABOVE TO SIMULATE INTERVAL SCHEDULER</div>
        </div>
      </section>`,

    'tray-toast': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>WINFORMS TRAY POPUP SIMULATOR</span>
          <span>IDLE FOOTPRINT: ~13 MB RAM</span>
        </div>
        <div class="artifact-bar">
          <span class="artifact-copy">Trigger a simulated desktop tray hydration popup:</span>
          <button type="button" class="btn primary" id="spawn-cat-btn">SPAWN TRAY CAT POPUP</button>
        </div>
      </section>`,

    'code-preview': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>REPOSITORY TELEMETRY // AUTO-SYNCED SPECIMEN</span>
          <span>LOCAL-FIRST ARCHITECTURE</span>
        </div>
        <div class="artifact-bar">
          <span class="artifact-copy">Synced automatically from GitHub REST API. Tap any file in the module map below to inspect its role.</span>
        </div>
      </section>`
  };

  const ARTIFACT_BINDERS = {
    'widget-switcher': (stage) => {
      const stylePills = stage.querySelectorAll('#inky-styles .mini-pill');
      const sizePills = stage.querySelectorAll('#inky-sizes .mini-pill');
      const card = document.getElementById('inky-card');
      const nextBtn = document.getElementById('inky-next-fact');
      const kickerEl = document.getElementById('inky-kicker');
      const headEl = document.getElementById('inky-heading');
      const bodyEl = document.getElementById('inky-body');

      let currentStyle = 'eink';
      let currentSize = '4x2';
      let factIdx = 0;

      const syncCardClass = () => {
        card.className = `inky-preview style-${currentStyle} size-${currentSize}`;
      };

      stylePills.forEach((btn) => {
        btn.addEventListener('click', () => {
          playMechanicalClick(1700, 0.012, 0.04);
          stylePills.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          currentStyle = btn.dataset.style;
          syncCardClass();
        });
      });

      sizePills.forEach((btn) => {
        btn.addEventListener('click', () => {
          playMechanicalClick(1500, 0.012, 0.04);
          sizePills.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          currentSize = btn.dataset.size;
          syncCardClass();
        });
      });

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          playMechanicalClick(1950, 0.014, 0.045);
          factIdx = (factIdx + 1) % INKY_FACTS.length;
          const f = INKY_FACTS[factIdx];
          kickerEl.textContent = f.kicker;
          headEl.textContent = f.title;
          bodyEl.textContent = f.body;
          nextBtn.textContent = `NEXT FACT ↻ (${factIdx + 1}/${INKY_FACTS.length})`;
        });
      }
    },

    'bilingual-shelf': (stage) => {
      const grid = document.getElementById('katha-grid');
      const filterPills = stage.querySelectorAll('#katha-filters .mini-pill');
      const surpriseBtn = document.getElementById('katha-surprise');

      const renderShelf = (filter = 'ALL', highlightIdx = -1) => {
        const list = KATHA_SHELF_BOOKS
          .map((b, idx) => ({ ...b, idx }))
          .filter((b) => filter === 'ALL' || b.lang.startsWith(filter));

        grid.innerHTML = list.map((b) => `
          <div class="katha-book ${b.idx === highlightIdx ? 'highlighted' : ''}" data-book-idx="${b.idx}">
            <div class="katha-lang">${esc(b.lang)}</div>
            <div class="katha-title ${b.ml ? 'ml' : ''}">${esc(b.title)}</div>
            <div class="katha-meta">${esc(b.meta)}</div>
          </div>
        `).join('');
      };

      filterPills.forEach((btn) => {
        btn.addEventListener('click', () => {
          playMechanicalClick(1650, 0.012, 0.04);
          filterPills.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          renderShelf(btn.dataset.filter, -1);
        });
      });

      if (surpriseBtn) {
        surpriseBtn.addEventListener('click', () => {
          playMechanicalClick(2050, 0.016, 0.05);
          filterPills.forEach((b) => b.classList.toggle('active', b.dataset.filter === 'ALL'));
          const pick = Math.floor(Math.random() * KATHA_SHELF_BOOKS.length);
          renderShelf('ALL', pick);
        });
      }
    },

    'sm2-demo': (stage) => {
      const status = document.getElementById('sm2-status');
      const blindBtn = document.getElementById('sm2-blind-toggle');
      const ansEl = document.getElementById('sm2-answer');
      let blinded = false;

      const setBlind = (next) => {
        blinded = next;
        ansEl.classList.toggle('blinded', blinded);
        blindBtn.textContent = blinded ? '🙈 BLIND RECALL: ON' : '👁 BLIND RECALL: OFF';
      };

      if (blindBtn) {
        blindBtn.addEventListener('click', () => {
          playMechanicalClick(1600, 0.012, 0.04);
          setBlind(!blinded);
        });
      }
      if (ansEl) {
        ansEl.addEventListener('click', () => {
          if (blinded) {
            playMechanicalClick(1850, 0.012, 0.04);
            setBlind(false);
          }
        });
      }

      stage.querySelectorAll('#sm2-actions .mini-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          playMechanicalClick(1800, 0.014, 0.045);
          setBlind(false);
          status.textContent = btn.dataset.rate;
        });
      });
    },

    'tray-toast': () => {
      const spawnBtn = document.getElementById('spawn-cat-btn');
      const toast = document.getElementById('cat-toast');
      const msgEl = document.getElementById('cat-toast-msg');
      const quips = [
        'Meow. Drink a glass of water before your next compile.',
        'Hydration check: your RAM is at 13 MB, your water intake is at 0.',
        'Click me to log a glass, or snooze 10 minutes.'
      ];
      if (spawnBtn) {
        spawnBtn.addEventListener('click', () => {
          playCatChime();
          msgEl.textContent = quips[Math.floor(Math.random() * quips.length)];
          toast.hidden = false;
        });
      }
    }
  };

  /* ---------- 7. Cat Toast Controls ---------- */
  let glasses = 0;
  const catToast = document.getElementById('cat-toast');
  document.getElementById('cat-toast-close').addEventListener('click', () => { catToast.hidden = true; });
  document.getElementById('cat-snooze').addEventListener('click', () => { catToast.hidden = true; });
  document.getElementById('cat-log-glass').addEventListener('click', () => {
    playMechanicalClick(2000, 0.015, 0.05);
    glasses += 1;
    document.getElementById('glass-count').textContent = String(glasses);
    document.getElementById('cat-toast-msg').textContent = `Logged! Total water tally: ${glasses} glass${glasses === 1 ? '' : 'es'}.`;
  });

  /* ---------- 8. Bootstrap Data & Initialize Workbench ---------- */
  const initWorkbench = (DATA) => {
    const PROJECTS = DATA.featured_projects || [];
    const LANGS = (DATA.tech_matrix && DATA.tech_matrix.languages) || [];
    const PROFILE = DATA.profile || {};
    const CONTACT = DATA.contact || {};
    const SOURCE = DATA._source || {};

    if (PROFILE.name) document.getElementById('operator-name').textContent = PROFILE.name;
    if (PROFILE.location) {
      document.getElementById('operator-sub').textContent = `@${PROFILE.login || 'vishn0o'} · ${PROFILE.location}`;
    }
    const avatarImg = document.getElementById('operator-avatar');
    if (PROFILE.avatar_url) avatarImg.src = PROFILE.avatar_url;
    avatarImg.addEventListener('error', () => {
      const ghFallback = avatarImg.dataset.fallbackSrc || PROFILE.github_avatar_url;
      if (ghFallback && avatarImg.src !== ghFallback) {
        avatarImg.src = ghFallback;
      } else {
        avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23121211'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='24' font-weight='bold' fill='%23D93800'%3EVS%3C/text%3E%3C/svg%3E";
      }
    });

    const syncedEl = document.getElementById('colophon-synced');
    const commitEl = document.getElementById('colophon-commit');
    if (SOURCE.synced_at) {
      const dt = new Date(SOURCE.synced_at);
      const formatted = Number.isNaN(dt.getTime())
        ? SOURCE.synced_at
        : dt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      syncedEl.textContent = formatted;
    } else {
      syncedEl.textContent = 'STATIC SNAPSHOT';
    }
    const latestRepo = PROJECTS[0];
    const shaLabel = SOURCE.head_commit
      ? `HEAD ${SOURCE.head_commit}`
      : (latestRepo && latestRepo.latest_commit_sha ? `LATEST ${latestRepo.latest_commit_sha}` : 'ZERO-DEPENDENCY');
    commitEl.textContent = `${shaLabel} · ${PROJECTS.length} REPOS`;

    const copyBtn = document.getElementById('copy-profile');
    copyBtn.addEventListener('click', () => {
      copyTextToClipboard(PROFILE.html_url || 'https://github.com/vishn0o', copyBtn, 'COPY PROFILE URL');
    });

    /* Master-Detail Rail & Sliding Active Indicator */
    const rail = document.getElementById('specimen-rail');
    const indicator = document.getElementById('rail-indicator');
    let activeIdx = 0;

    const updateRailIndicator = (idx) => {
      const activeTab = rail.querySelector(`.specimen-tab[data-idx="${idx}"]`);
      if (!activeTab || !indicator || window.innerWidth <= 1024) return;
      indicator.style.height = `${activeTab.offsetHeight}px`;
      indicator.style.transform = `translateY(${activeTab.offsetTop}px)`;
    };

    const syncUrlHash = (projectId) => {
      const nextHash = `#specimen=${encodeURIComponent(projectId)}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(null, '', nextHash);
      }
    };

    const parseModuleLine = (rawLine) => {
      const m = String(rawLine).match(/^(\S+)\s+(.*)$/);
      if (!m) return { file: rawLine, role: 'Repository module' };
      return { file: m[1], role: m[2].trim() };
    };

    const renderStage = (idx, opts = {}) => {
      const { scrollToDeck = false, updateHash = true, silent = false } = opts;
      const p = PROJECTS[idx];
      if (!p) return;
      if (!silent) playMechanicalClick(1550, 0.014, 0.045);
      activeIdx = idx;

      rail.querySelectorAll('.specimen-tab').forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === idx));
      });
      updateRailIndicator(idx);

      const artifactType = p.artifact_type || 'code-preview';
      const renderArtifact = ARTIFACT_RENDERERS[artifactType] || ARTIFACT_RENDERERS['code-preview'];
      const commitBadge = p.latest_commit_sha ? ` · COMMIT ${esc(p.latest_commit_sha)}` : '';
      const rawLines = (p.snippet && p.snippet.lines) || [];
      const parsedLines = rawLines.map(parseModuleLine);
      const firstInfo = parsedLines[0]
        ? `<strong>${esc(parsedLines[0].file)}</strong> — ${esc(parsedLines[0].role)}`
        : 'Select a module line above to inspect.';

      stageEl.innerHTML = `
        <div class="stage-animate">
          <div class="stage-header">
            <div>
              <div class="stage-kicker">SPECIMEN ${pad(idx + 1)} // ${esc(p.platform)} · ${esc(p.footprint)}${commitBadge}</div>
              <h3 class="stage-title">${esc(p.formatted_title)}</h3>
            </div>
            <div class="stage-links">
              <a class="btn primary" href="${esc(p.html_url)}" target="_blank" rel="noopener">SOURCE CODE ↗</a>
              ${p.homepage ? `<a class="btn" href="${esc(p.homepage)}" target="_blank" rel="noopener">LIVE APP ↗</a>` : ''}
            </div>
          </div>

          <p class="stage-summary">${esc(p.readme_summary)}</p>

          ${renderArtifact(p)}

          <div class="stage-cols">
            <div>
              <div class="detail-block">
                <span class="detail-label">PROBLEM SOLVED</span>
                <p class="detail-text">${esc(p.problem_solved)}</p>
              </div>
              <div class="detail-block">
                <span class="detail-label">SYSTEM ARCHITECTURE</span>
                <p class="detail-text">${esc(p.architecture)}</p>
              </div>
              <div class="detail-block">
                <span class="detail-label">KEY CAPABILITIES</span>
                <ul class="feature-list">
                  ${(p.key_features || []).map((f, i) => `<li><span>${pad(i + 1)}</span>${esc(f)}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div>
              <div class="module-box">
                <div class="module-head">
                  <span>${esc(p.snippet && p.snippet.label)}</span>
                  <span>INTERACTIVE</span>
                </div>
                <div class="module-lines" id="module-lines">
                  ${rawLines.map((l, lineIdx) => `
                    <button type="button" class="module-line ${lineIdx === 0 ? 'active' : ''}" data-line-idx="${lineIdx}">${esc(l)}</button>
                  `).join('')}
                </div>
                <div class="module-inspector" id="module-inspector">${firstInfo}</div>
              </div>
              <div class="stack-tags">
                ${(p.stack || []).map((t) => `<span>${esc(t)}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      const inspectorEl = document.getElementById('module-inspector');
      stageEl.querySelectorAll('.module-line').forEach((lineBtn) => {
        lineBtn.addEventListener('click', () => {
          playMechanicalClick(1850, 0.01, 0.035);
          stageEl.querySelectorAll('.module-line').forEach((b) => b.classList.remove('active'));
          lineBtn.classList.add('active');
          const info = parsedLines[Number(lineBtn.dataset.lineIdx)];
          if (info && inspectorEl) {
            inspectorEl.innerHTML = `<strong>${esc(info.file)}</strong> — ${esc(info.role)}`;
          }
        });
      });

      if (ARTIFACT_BINDERS[artifactType]) {
        ARTIFACT_BINDERS[artifactType](stageEl, p);
      }

      if (updateHash) syncUrlHash(p.id);
      if (scrollToDeck) {
        document.getElementById('workbench').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const tabsHtml = PROJECTS.map((p, i) => `
      <button class="specimen-tab" type="button" role="tab" aria-selected="${i === 0}" data-idx="${i}">
        <div class="tab-top">
          <span class="tab-idx-group">
            ${i < 9 ? `<span class="tab-key">${pad(i + 1)}</span>` : ''}
            <span class="tab-idx">SPECIMEN_${pad(i + 1)}</span>
          </span>
          <span>${esc(p.platform)}</span>
        </div>
        <div class="tab-title">${esc(p.formatted_title)}</div>
        <div class="tab-foot">${esc(p.type)}</div>
      </button>
    `).join('');

    rail.insertAdjacentHTML('beforeend', tabsHtml);

    rail.querySelectorAll('.specimen-tab').forEach((btn) => {
      btn.addEventListener('click', () => renderStage(Number(btn.dataset.idx)));
    });

    window.addEventListener('resize', () => updateRailIndicator(activeIdx), { passive: true });

    const maxKey = Math.min(9, PROJECTS.length);
    if (isTouchDevice()) {
      const hintEl = document.getElementById('workbench-hint');
      if (hintEl) {
        hintEl.textContent = 'Tap a specimen above to inspect its module map and test a live artifact.';
      }
    } else if (maxKey > 0) {
      const rangeText = maxKey === 1 ? '1' : `1–${maxKey}`;
      const rangeEl = document.getElementById('shortcut-range');
      if (rangeEl) rangeEl.textContent = rangeText;
      const legendEl = document.getElementById('keyboard-legend');
      if (legendEl) {
        legendEl.innerHTML = `
          <span><kbd>1</kbd>–<kbd>${maxKey}</kbd> Switch Specimen</span>
          <span><kbd>T</kbd> Theme</span>
          <span><kbd>M</kbd> Mechanical SFX</span>
          <span><kbd>⌘K</kbd> / <kbd>/</kbd> Palette</span>
        `;
      }
    }

    const resolveHashIndex = () => {
      const hash = window.location.hash || '';
      const match = hash.match(/^#specimen=([^&]+)/i);
      if (!match) return -1;
      const targetId = decodeURIComponent(match[1]).toLowerCase();
      return PROJECTS.findIndex((p) => p.id.toLowerCase() === targetId);
    };

    const initialIdx = Math.max(0, resolveHashIndex());
    renderStage(initialIdx, { updateHash: resolveHashIndex() !== -1, silent: true });
    requestAnimationFrame(() => updateRailIndicator(initialIdx));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => updateRailIndicator(activeIdx));
    }

    window.addEventListener('hashchange', () => {
      const idx = resolveHashIndex();
      if (idx !== -1 && idx !== activeIdx) {
        renderStage(idx, { scrollToDeck: true, updateHash: false });
      }
    });

    /* Language Footprint Bar (Hover + Tap-to-Lock Support for Phones & Tablets) */
    const totalBytes = LANGS.reduce((sum, l) => sum + Number(l.bytes || 0), 0);
    document.getElementById('total-kb').textContent = `${Math.round(totalBytes / 1024)} KB`;
    document.getElementById('shipped-count').textContent = pad(PROJECTS.length);
    document.getElementById('byte-summary').textContent = `TOTAL SOURCE: ${(totalBytes / 1024).toFixed(1)} KB ACROSS ${PROJECTS.length} REPOS`;

    const stackedBar = document.getElementById('stacked-bar');
    const legend = document.getElementById('lang-legend');
    const calloutEl = document.getElementById('footprint-callout');
    const projectTitleById = new Map(PROJECTS.map((p) => [p.id.toLowerCase(), p.formatted_title]));
    const defaultCalloutText = isTouchDevice()
      ? 'TAP A LANGUAGE SEGMENT OR ROW TO INSPECT REPOSITORY USAGE'
      : 'HOVER OR TAP A LANGUAGE SEGMENT TO INSPECT REPOSITORY USAGE';
    if (calloutEl) calloutEl.textContent = defaultCalloutText;

    stackedBar.innerHTML = LANGS.map((l, i) => {
      const pct = totalBytes > 0 ? (l.bytes / totalBytes) * 100 : 0;
      const colorClass = `lang-c-${i % 6}`;
      return `<div class="bar-seg ${colorClass}" data-lang-idx="${i}" data-target-width="${pct.toFixed(2)}%" title="${esc(l.name)}: ${pct.toFixed(1)}%"></div>`;
    }).join('');

    legend.innerHTML = LANGS.map((l, i) => {
      const pct = totalBytes > 0 ? ((l.bytes / totalBytes) * 100).toFixed(1) : '0.0';
      const kb = (l.bytes / 1024).toFixed(1);
      const colorClass = `lang-c-${i % 6}`;
      return `
        <div class="legend-item" data-lang-idx="${i}">
          <span class="legend-left"><span class="swatch ${colorClass}"></span>${esc(l.name)}</span>
          <span class="legend-right">${kb} KB · ${pct}%</span>
        </div>`;
    }).join('');

    const animateBarSegments = () => {
      stackedBar.querySelectorAll('.bar-seg').forEach((seg, idx) => {
        seg.style.transitionDelay = `${idx * 45}ms`;
        seg.style.width = seg.dataset.targetWidth || '0%';
      });
    };

    const footprintBox = document.getElementById('footprint-box');
    if ('IntersectionObserver' in window && footprintBox) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          animateBarSegments();
          io.disconnect();
        }
      }, { threshold: 0.25 });
      io.observe(footprintBox);
    } else {
      animateBarSegments();
    }

    let lockedLangIdx = -1;

    const highlightLang = (idx) => {
      const l = LANGS[idx];
      stackedBar.querySelectorAll('.bar-seg').forEach((el) => {
        const match = Number(el.dataset.langIdx) === idx;
        el.classList.toggle('is-hovered', match);
        el.style.opacity = idx === -1 || match ? '1' : '0.45';
      });
      legend.querySelectorAll('.legend-item').forEach((el) => {
        el.classList.toggle('is-hovered', Number(el.dataset.langIdx) === idx);
      });
      if (!calloutEl) return;
      if (!l) {
        calloutEl.textContent = defaultCalloutText;
        return;
      }
      const repoNames = (l.used_in || []).map((id) => projectTitleById.get(id.toLowerCase()) || id).join(', ');
      const pct = totalBytes > 0 ? ((l.bytes / totalBytes) * 100).toFixed(1) : '0.0';
      calloutEl.textContent = `${l.name.toUpperCase()} (${pct}% · ${(l.bytes / 1024).toFixed(1)} KB) → USED IN: ${repoNames || 'N/A'}`;
    };

    [stackedBar, legend].forEach((container) => {
      container.addEventListener('mouseover', (e) => {
        if (lockedLangIdx !== -1) return;
        const target = e.target.closest('[data-lang-idx]');
        if (target) highlightLang(Number(target.dataset.langIdx));
      });
      container.addEventListener('mouseleave', () => {
        if (lockedLangIdx === -1) highlightLang(-1);
      });
      container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-lang-idx]');
        if (!target) return;
        playMechanicalClick(1750, 0.012, 0.04);
        const idx = Number(target.dataset.langIdx);
        lockedLangIdx = lockedLangIdx === idx ? -1 : idx;
        highlightLang(lockedLangIdx);
      });
    });

    /* Command Palette (Cmd/Ctrl+K or /) */
    const cmdBackdrop = document.getElementById('cmd-backdrop');
    const cmdInput = document.getElementById('cmd-input');
    const cmdList = document.getElementById('cmd-list');
    const cmdOpen = document.getElementById('cmd-open');
    const cmdClose = document.getElementById('cmd-close');

    const commands = [
      ...PROJECTS.map((p, idx) => ({
        label: `Inspect Specimen ${pad(idx + 1)}: ${p.formatted_title}`,
        meta: idx < 9 ? `KEY: ${idx + 1} · ${p.platform}` : p.platform,
        run: () => renderStage(idx, { scrollToDeck: true })
      })),
      { label: 'Toggle Theme (E-Ink Paper / Oscilloscope Dark)', meta: 'KEY: T', run: () => toggleTheme() },
      { label: 'Toggle Mechanical Switch Audio Detents (SFX)', meta: 'KEY: M', run: toggleSfx },
      { label: 'Print Swiss Specification Sheet (A4)', meta: 'CTRL+P', run: () => window.print() },
      {
        label: 'Copy GitHub Profile URL',
        meta: 'CLIPBOARD',
        run: () => copyTextToClipboard(PROFILE.html_url || 'https://github.com/vishn0o', copyBtn, 'COPY PROFILE URL')
      },
      ...(CONTACT.email ? [{
        label: `Copy Contact Email (${CONTACT.email})`,
        meta: 'CLIPBOARD',
        run: () => copyTextToClipboard(CONTACT.email, null, '')
      }] : []),
      {
        label: 'Open GitHub Profile (@vishn0o)',
        meta: 'EXTERNAL ↗',
        run: () => window.open(PROFILE.html_url || 'https://github.com/vishn0o', '_blank', 'noopener')
      }
    ];

    let selectedCmd = 0;
    let filteredCmds = [...commands];

    const renderCommands = () => {
      const q = cmdInput.value.trim().toLowerCase();
      filteredCmds = commands.filter((c) => !q || c.label.toLowerCase().includes(q) || c.meta.toLowerCase().includes(q));
      selectedCmd = Math.min(selectedCmd, Math.max(0, filteredCmds.length - 1));
      cmdList.innerHTML = filteredCmds.length
        ? filteredCmds.map((c, i) => `
          <li class="cmd-item ${i === selectedCmd ? 'selected' : ''}" role="option" aria-selected="${i === selectedCmd}" data-idx="${i}">
            <span>${esc(c.label)}</span>
            <span class="cmd-meta">${esc(c.meta)}</span>
          </li>`).join('')
        : `<li class="cmd-item"><span>No matching commands</span></li>`;

      cmdList.querySelectorAll('.cmd-item[data-idx]').forEach((el) => {
        el.addEventListener('click', () => {
          const cmd = filteredCmds[Number(el.dataset.idx)];
          closeCmd();
          if (cmd) cmd.run();
        });
      });
    };

    const openCmd = () => {
      playMechanicalClick(1750, 0.014, 0.045);
      cmdBackdrop.hidden = false;
      cmdInput.value = '';
      selectedCmd = 0;
      renderCommands();
      if (!isTouchDevice()) cmdInput.focus();
    };
    const closeCmd = () => { cmdBackdrop.hidden = true; };

    cmdOpen.addEventListener('click', openCmd);
    cmdClose.addEventListener('click', closeCmd);
    cmdBackdrop.addEventListener('click', (e) => { if (e.target === cmdBackdrop) closeCmd(); });
    cmdInput.addEventListener('input', () => { selectedCmd = 0; renderCommands(); });

    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedCmd = (selectedCmd + 1) % Math.max(1, filteredCmds.length);
        renderCommands();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedCmd = (selectedCmd - 1 + Math.max(1, filteredCmds.length)) % Math.max(1, filteredCmds.length);
        renderCommands();
      } else if (e.key === 'Enter' && filteredCmds[selectedCmd]) {
        e.preventDefault();
        const cmd = filteredCmds[selectedCmd];
        closeCmd();
        cmd.run();
      } else if (e.key === 'Escape') {
        closeCmd();
      }
    });

    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        cmdBackdrop.hidden ? openCmd() : closeCmd();
        return;
      }
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        openCmd();
      } else if (e.key === 'Escape' && !cmdBackdrop.hidden) {
        closeCmd();
      } else if (e.key.toLowerCase() === 't') {
        toggleTheme();
      } else if (e.key.toLowerCase() === 'm') {
        toggleSfx();
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        if (PROJECTS[idx]) renderStage(idx, { scrollToDeck: true });
      }
    });
  };

  const readFallbackSnapshot = () => {
    const el = document.getElementById('specimens-fallback');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (_) { return null; }
  };

  fetch('./data/specimens.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(initWorkbench)
    .catch((err) => {
      const fallback = readFallbackSnapshot();
      if (fallback) {
        initWorkbench(fallback);
      } else {
        stageEl.innerHTML = `<div class="artifact-bar"><span class="artifact-copy">Unable to load <code>./data/specimens.json</code> (${esc(err.message)}).</span></div>`;
      }
    });
})();
