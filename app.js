(() => {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const sanitizeUrl = (url, fallback = '#') => {
    const raw = String(url ?? '').trim();
    if (!raw) return fallback;
    if (/^https?:\/\//i.test(raw)) return raw;
    return fallback;
  };
  const isTouchDevice = () =>
    (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
    ('ontouchstart' in window);

  const htmlEl = document.documentElement;
  const themeMeta = document.getElementById('theme-meta');
  const toggleBtn = document.getElementById('theme-toggle');
  const paletteBtns = document.querySelectorAll('[data-palette-btn]');

  const PALETTE_META_COLORS = {
    terracotta: { paper: '#FBF8F3', dark: '#151210' },
    teal:       { paper: '#F5FAFB', dark: '#0E1415' },
    indigo:     { paper: '#FAF8FF', dark: '#121318' },
    olive:      { paper: '#F8FAF0', dark: '#11140E' }
  };
  const PALETTE_ORDER = ['terracotta', 'teal', 'indigo', 'olive'];

  const syncThemeMeta = () => {
    const mode = htmlEl.getAttribute('data-theme') || 'paper';
    const pal = htmlEl.getAttribute('data-palette') || 'terracotta';
    const color = (PALETTE_META_COLORS[pal] && PALETTE_META_COLORS[pal][mode]) || '#FBF8F3';
    if (themeMeta) themeMeta.setAttribute('content', color);
  };

  const applyPalette = (palette, persist = true) => {
    const valid = PALETTE_ORDER.includes(palette) ? palette : 'terracotta';
    htmlEl.setAttribute('data-palette', valid);
    paletteBtns.forEach((btn) => {
      const isMatch = btn.dataset.paletteBtn === valid;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', String(isMatch));
    });
    syncThemeMeta();
    if (persist) {
      try { localStorage.setItem('vishn0o_palette', valid); } catch (_) {}
    }
  };

  const cyclePalette = () => {
    const current = htmlEl.getAttribute('data-palette') || 'terracotta';
    const next = PALETTE_ORDER[(PALETTE_ORDER.indexOf(current) + 1) % PALETTE_ORDER.length];
    applyPalette(next, true);
  };

  paletteBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyPalette(btn.dataset.paletteBtn, true));
  });

  const applyTheme = (mode, persist = true) => {
    htmlEl.setAttribute('data-theme', mode);
    toggleBtn.querySelectorAll('.opt').forEach((el) => {
      el.classList.toggle('active', el.dataset.mode === mode);
    });
    syncThemeMeta();
    if (persist) {
      try { localStorage.setItem('vishn0o_theme', mode); } catch (_) {}
    }
  };

  const initThemeAndPalette = () => {
    let savedPalette = null;
    try { savedPalette = localStorage.getItem('vishn0o_palette'); } catch (_) {}
    applyPalette(savedPalette || 'terracotta', false);

    let savedTheme = null;
    try { savedTheme = localStorage.getItem('vishn0o_theme'); } catch (_) {}
    if (savedTheme === 'dark' || savedTheme === 'paper') {
      applyTheme(savedTheme, false);
      return;
    }
    const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(osPrefersDark ? 'dark' : 'paper', false);
  };

  initThemeAndPalette();

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      let saved = null;
      try { saved = localStorage.getItem('vishn0o_theme'); } catch (_) {}
      if (!saved) applyTheme(e.matches ? 'dark' : 'paper', false);
    });
  }

  const toggleTheme = () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'paper' : 'dark';
    applyTheme(next, true);
  };

  toggleBtn.addEventListener('click', toggleTheme);

  const clockEl = document.getElementById('live-clock');
  const istFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const updateClock = () => {
    if (document.hidden) return;
    clockEl.textContent = `Manipal · ${istFormatter.format(new Date())} IST`;
  };
  updateClock();
  const clockInterval = setInterval(updateClock, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateClock();
  });
  window.addEventListener('pagehide', () => clearInterval(clockInterval), { once: true });

  const portraitToggle = document.getElementById('portrait-toggle');
  if (portraitToggle) {
    portraitToggle.addEventListener('click', () => {
      portraitToggle.classList.toggle('color-active');
    });
  }

  const stageEl = document.getElementById('specimen-stage');

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
    window.addEventListener('pagehide', () => spyObserver.disconnect(), { once: true });
  }

  const copyTextToClipboard = async (text, triggerLabelEl, defaultLabel) => {
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
    if (triggerLabelEl) {
      triggerLabelEl.textContent = copied ? 'Copied to Clipboard' : text;
      setTimeout(() => { triggerLabelEl.textContent = defaultLabel; }, 2200);
    }
  };

  const INKY_FACTS = [
    {
      kicker: 'Wikipedia Trivia · Cached in Room',
      title: 'The Great Emu War (1932)',
      body: 'Royal Australian Artillery soldiers deployed with Lewis machine guns in Western Australia failed to curb the emu population.'
    },
    {
      kicker: 'Engineering History · Offline Archive',
      title: 'Apollo Guidance Computer Rope Memory',
      body: 'Mission software was physically woven by hand using copper wires threaded through or around magnetic ferrite cores.'
    },
    {
      kicker: 'Systems Lore · Daily Quiz Pool',
      title: 'The 1970 Unix Epoch Origin',
      body: 'Unix time counts seconds since 00:00:00 UTC on 1 January 1970—chosen as a clean, recent round date by early Bell Labs engineers.'
    },
    {
      kicker: 'Natural Science · Bookmarked Fact',
      title: 'Voyager 1 Golden Record',
      body: 'Launched in 1977, Voyager 1 carries a gold-plated copper phonograph record encoded with 115 analog images and greetings in 55 languages.'
    }
  ];

  const KATHA_SHELF_BOOKS = [
    { lang: 'Malayalam · Local SQLite', title: 'ഖസാക്കിന്റെ ഇതിഹാസം', ml: true, meta: 'ഒ.വി. വിജയൻ · ★★★★★ · 100% Read' },
    { lang: 'English · Local SQLite', title: 'The Design of Everyday Things', ml: false, meta: 'Don Norman · ★★★★½ · Reading (68%)' },
    { lang: 'Malayalam · Local SQLite', title: 'രണ്ടാമൂഴം', ml: true, meta: 'എം.ടി. വാസുദേവൻ നായർ · ★★★★★ · 100% Read' },
    { lang: 'English · Local SQLite', title: 'Designing Data-Intensive Applications', ml: false, meta: 'Martin Kleppmann · ★★★★★ · Reading (42%)' }
  ];

  const ARTIFACT_RENDERERS = {
    'widget-switcher': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>Widget Preview · 5 Visual Styles × 3 Sizes</span>
          <span>Tap to cycle offline archive</span>
        </div>
        <div class="artifact-controls-bar">
          <div class="pill-row" id="inky-styles">
            <button type="button" class="mini-pill active" data-style="eink">E-Ink</button>
            <button type="button" class="mini-pill" data-style="swiss">Swiss</button>
            <button type="button" class="mini-pill" data-style="glass">Tinted</button>
            <button type="button" class="mini-pill" data-style="dot">Dot Matrix</button>
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
              <button type="button" class="inky-cycle-btn" id="inky-next-fact">Next Fact (1/4)</button>
            </div>
            <div class="inky-heading" id="inky-heading">${esc(INKY_FACTS[0].title)}</div>
            <div class="inky-body" id="inky-body">${esc(INKY_FACTS[0].body)}</div>
          </div>
        </div>
      </section>`,

    'bilingual-shelf': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>Thalir (തളിർ) Bilingual Shelf Preview</span>
          <span>Bundled Manjari &amp; DM Sans · Offline</span>
        </div>
        <div class="katha-toolbar">
          <div class="pill-row" id="katha-filters">
            <button type="button" class="mini-pill active" data-filter="ALL">All (4)</button>
            <button type="button" class="mini-pill" data-filter="MALAYALAM">മലയാളം (2)</button>
            <button type="button" class="mini-pill" data-filter="ENGLISH">English (2)</button>
          </div>
          <button type="button" class="mini-pill accent-pill" id="katha-surprise">Pick Random Book</button>
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
          <span>SM-2 Spaced Repetition &amp; Blind Recall</span>
          <span>Confidence-Weighted Scoring</span>
        </div>
        <div class="sm2-panel">
          <div class="sm2-top">
            <div class="sm2-q">Q: Why does SQLite WAL mode improve concurrent local reads?</div>
            <button type="button" class="mini-pill" id="sm2-blind-toggle">Hide Answer: Off</button>
          </div>
          <div class="sm2-a" id="sm2-answer">Readers do not block writers and writers do not block readers because changes append to a separate write-ahead log.</div>
          <div class="pill-row" id="sm2-actions">
            <button type="button" class="mini-pill" data-rate="Again → Relearn in 10 mins (0× marks · Ease -0.20)">Again (10m)</button>
            <button type="button" class="mini-pill" data-rate="Fuzzy → Next review in 1 day (0.5× marks · Ease -0.15)">Fuzzy (1d)</button>
            <button type="button" class="mini-pill" data-rate="Good → Next review in 3 days (1.0× marks · Ease +0.00)">Good (3d)</button>
          </div>
          <div class="sm2-status" id="sm2-status">Choose a recall rating above to preview the next review interval</div>
        </div>
      </section>`,

    'tray-toast': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>WinForms System Tray Notification</span>
          <span>Idle RAM: ~13 MB</span>
        </div>
        <div class="artifact-bar">
          <span class="artifact-copy">Trigger a simulated desktop hydration reminder toast:</span>
          <button type="button" class="btn primary" id="spawn-cat-btn">Show Tray Reminder</button>
        </div>
      </section>`,

    'code-preview': () => `
      <section class="artifact-section">
        <div class="artifact-head">
          <span>Repository Snapshot</span>
          <span>Local-First Architecture</span>
        </div>
        <div class="artifact-bar">
          <span class="artifact-copy">Synced from GitHub REST API. Select any file in the module map below to inspect its role.</span>
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
          stylePills.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          currentStyle = btn.dataset.style;
          syncCardClass();
        });
      });

      sizePills.forEach((btn) => {
        btn.addEventListener('click', () => {
          sizePills.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          currentSize = btn.dataset.size;
          syncCardClass();
        });
      });

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          factIdx = (factIdx + 1) % INKY_FACTS.length;
          const f = INKY_FACTS[factIdx];
          kickerEl.textContent = f.kicker;
          headEl.textContent = f.title;
          bodyEl.textContent = f.body;
          nextBtn.textContent = `Next Fact (${factIdx + 1}/${INKY_FACTS.length})`;
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
          .filter((b) => filter === 'ALL' || b.lang.toUpperCase().startsWith(filter));

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
          filterPills.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          renderShelf(btn.dataset.filter, -1);
        });
      });

      if (surpriseBtn) {
        surpriseBtn.addEventListener('click', () => {
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
        blindBtn.textContent = blinded ? 'Hide Answer: On' : 'Hide Answer: Off';
      };

      if (blindBtn) {
        blindBtn.addEventListener('click', () => setBlind(!blinded));
      }
      if (ansEl) {
        ansEl.addEventListener('click', () => {
          if (blinded) setBlind(false);
        });
      }

      stage.querySelectorAll('#sm2-actions .mini-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
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
        'Hydration check: RAM is at 13 MB, water intake is at 0.',
        'Tap Log Glass to record a drink, or snooze for 10 minutes.'
      ];
      if (spawnBtn) {
        spawnBtn.addEventListener('click', () => {
          msgEl.textContent = quips[Math.floor(Math.random() * quips.length)];
          toast.hidden = false;
        });
      }
    }
  };

  let glasses = 0;
  const catToast = document.getElementById('cat-toast');
  document.getElementById('cat-toast-close').addEventListener('click', () => { catToast.hidden = true; });
  document.getElementById('cat-snooze').addEventListener('click', () => { catToast.hidden = true; });
  document.getElementById('cat-log-glass').addEventListener('click', () => {
    glasses += 1;
    document.getElementById('glass-count').textContent = String(glasses);
    document.getElementById('cat-toast-msg').textContent = `Logged! Total water tally: ${glasses} glass${glasses === 1 ? '' : 'es'}.`;
  });

  const syncLiveGitHubData = async (DATA) => {
    const login = (DATA.profile && DATA.profile.login) || 'vishn0o';
    const projects = DATA.featured_projects || [];

    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
          headers: { Accept: 'application/vnd.github+json' }
        }),
        fetch(`https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=100&sort=updated`, {
          headers: { Accept: 'application/vnd.github+json' }
        })
      ]);

      if (userRes.ok) {
        const ghUser = await userRes.json();
        if (ghUser.name) DATA.profile.name = ghUser.name;
        if (ghUser.bio) DATA.profile.bio = ghUser.bio;
        if (ghUser.html_url) DATA.profile.html_url = sanitizeUrl(ghUser.html_url, DATA.profile.html_url);
        if (ghUser.avatar_url) DATA.profile.github_avatar_url = sanitizeUrl(ghUser.avatar_url, DATA.profile.github_avatar_url);
      }

      if (reposRes.ok) {
        const ghRepos = await reposRes.json();
        const byName = new Map(ghRepos.map((r) => [r.name.toLowerCase(), r]));
        projects.forEach((p) => {
          const liveRepo = byName.get((p.name || p.id).toLowerCase());
          if (liveRepo) {
            if (liveRepo.description) p.description = liveRepo.description;
            if (liveRepo.updated_at) p.updated_at = liveRepo.updated_at;
            if (liveRepo.pushed_at) p.pushed_at = liveRepo.pushed_at;
            if (liveRepo.html_url) p.html_url = sanitizeUrl(liveRepo.html_url, p.html_url);
            if (liveRepo.homepage) p.homepage = sanitizeUrl(liveRepo.homepage, null);
          }
        });
        DATA._source = DATA._source || {};
        DATA._source.synced_at = new Date().toISOString();
      }

      const inkyProj = projects.find((p) => (p.id || '').toLowerCase() === 'inkynerd');
      if (inkyProj) {
        const relRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(login)}/InkyNerd/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (relRes.ok) {
          const rel = await relRes.json();
          const apkAsset = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
          if (apkAsset && apkAsset.browser_download_url) {
            inkyProj.apk_download_url = sanitizeUrl(apkAsset.browser_download_url, inkyProj.release_url);
            inkyProj.apk_version = rel.tag_name || 'Latest';
          } else if (rel.html_url) {
            inkyProj.apk_download_url = sanitizeUrl(rel.html_url, inkyProj.release_url);
            inkyProj.apk_version = rel.tag_name || 'Latest';
          }
        } else {
          inkyProj.apk_download_url = `https://github.com/${encodeURIComponent(login)}/InkyNerd/releases/latest`;
        }
      }
    } catch (_) {}

    return DATA;
  };

  const initWorkbench = (DATA) => {
    const PROJECTS = DATA.featured_projects || [];
    const LANGS = (DATA.tech_matrix && DATA.tech_matrix.languages) || [];
    const PROFILE = DATA.profile || {};
    const CONTACT = DATA.contact || {};
    const SOURCE = DATA._source || {};

    if (PROFILE.name) document.getElementById('operator-name').textContent = PROFILE.name;
    document.getElementById('operator-sub').textContent = `@${PROFILE.login || 'vishn0o'}`;

    const bioEl = document.getElementById('hero-bio');
    if (bioEl && PROFILE.bio) {
      bioEl.textContent = PROFILE.bio;
    }

    const ghBtn = document.getElementById('github-profile-btn');
    if (ghBtn && PROFILE.html_url) ghBtn.href = sanitizeUrl(PROFILE.html_url, 'https://github.com/vishn0o');

    const liBtn = document.getElementById('linkedin-profile-btn');
    if (liBtn) {
      liBtn.href = 'https://www.linkedin.com/in/vishn0o/';
    }

    const avatarImg = document.getElementById('operator-avatar');
    if (PROFILE.avatar_url) avatarImg.src = PROFILE.avatar_url;
    avatarImg.addEventListener('error', () => {
      const ghFallback = sanitizeUrl(avatarImg.dataset.fallbackSrc || PROFILE.github_avatar_url, '');
      if (ghFallback && avatarImg.src !== ghFallback) {
        avatarImg.src = ghFallback;
      } else {
        avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%238F3A1E'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' font-weight='bold' fill='%23FFFFFF'%3EVS%3C/text%3E%3C/svg%3E";
      }
    });

    const syncedEl = document.getElementById('colophon-synced');
    const commitEl = document.getElementById('colophon-commit');
    if (SOURCE.synced_at) {
      const dt = new Date(SOURCE.synced_at);
      syncedEl.textContent = Number.isNaN(dt.getTime())
        ? SOURCE.synced_at
        : dt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    } else {
      syncedEl.textContent = 'Static Snapshot';
    }
    const latestRepo = PROJECTS[0];
    const shaLabel = SOURCE.head_commit
      ? `Commit ${SOURCE.head_commit}`
      : (latestRepo && latestRepo.latest_commit_sha ? `Latest ${latestRepo.latest_commit_sha}` : 'Zero Dependencies');
    commitEl.textContent = `${shaLabel} · ${PROJECTS.length} Repos`;

    const copyBtn = document.getElementById('copy-profile');
    const copyLabelEl = document.getElementById('copy-profile-label');
    copyBtn.addEventListener('click', () => {
      copyTextToClipboard(sanitizeUrl(PROFILE.html_url, 'https://github.com/vishn0o'), copyLabelEl, 'Copy Profile Link');
    });

    const rail = document.getElementById('specimen-rail');
    let activeIdx = 0;

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

    const formatRelativeUpdate = (isoStr) => {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return '';
      return ` · Updated ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    const renderStage = (idx, opts = {}) => {
      const { scrollToDeck = false, updateHash = true } = opts;
      const p = PROJECTS[idx];
      if (!p) return;
      activeIdx = idx;

      rail.querySelectorAll('.specimen-tab').forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === idx));
      });

      const artifactType = p.artifact_type || 'code-preview';
      const renderArtifact = ARTIFACT_RENDERERS[artifactType] || ARTIFACT_RENDERERS['code-preview'];
      const updatedBadge = formatRelativeUpdate(p.pushed_at || p.updated_at);
      const rawLines = (p.snippet && p.snippet.lines) || [];
      const parsedLines = rawLines.map(parseModuleLine);
      const firstInfo = parsedLines[0]
        ? `<strong>${esc(parsedLines[0].file)}</strong> — ${esc(parsedLines[0].role)}`
        : 'Select a module above to inspect its role.';

      const downloadUrl = p.apk_download_url || p.release_url;
      const safeDownloadUrl = downloadUrl ? sanitizeUrl(downloadUrl, '') : '';
      const safeRepoUrl = sanitizeUrl(p.html_url, 'https://github.com/vishn0o');
      const safeHomeUrl = p.homepage ? sanitizeUrl(p.homepage, '') : '';
      const downloadLabel = p.apk_version ? `Download APK (${esc(p.apk_version)})` : 'Download Latest APK';

      stageEl.innerHTML = `
        <div>
          <div class="stage-header">
            <div>
              <div class="stage-kicker">Project ${pad(idx + 1)} · ${esc(p.platform)} · ${esc(p.footprint)}${esc(updatedBadge)}</div>
              <h3 class="stage-title">${esc(p.formatted_title)}</h3>
            </div>
            <div class="stage-links">
              ${safeDownloadUrl ? `
                <a class="btn primary" href="${esc(safeDownloadUrl)}" target="_blank" rel="noopener noreferrer">
                  <span class="material-symbols-rounded" aria-hidden="true">download</span>
                  <span>${downloadLabel}</span>
                </a>
                <a class="btn tonal" href="${esc(safeRepoUrl)}" target="_blank" rel="noopener noreferrer">
                  <span>Source Code</span>
                  <span class="material-symbols-rounded" aria-hidden="true">north_east</span>
                </a>
              ` : `
                <a class="btn primary" href="${esc(safeRepoUrl)}" target="_blank" rel="noopener noreferrer">
                  <span>Source Code</span>
                  <span class="material-symbols-rounded" aria-hidden="true">north_east</span>
                </a>
              `}
              ${safeHomeUrl ? `<a class="btn tonal" href="${esc(safeHomeUrl)}" target="_blank" rel="noopener noreferrer"><span>Open App</span><span class="material-symbols-rounded" aria-hidden="true">open_in_new</span></a>` : ''}
            </div>
          </div>

          <p class="stage-summary">${esc(p.readme_summary)}</p>

          ${renderArtifact(p)}

          <div class="stage-cols">
            <div>
              <div class="detail-block">
                <span class="detail-label">Problem Solved</span>
                <p class="detail-text">${esc(p.problem_solved)}</p>
              </div>
              <div class="detail-block">
                <span class="detail-label">System Architecture</span>
                <p class="detail-text">${esc(p.architecture)}</p>
              </div>
              <div class="detail-block">
                <span class="detail-label">Key Capabilities</span>
                <ul class="feature-list">
                  ${(p.key_features || []).map((f, i) => `<li><span>${pad(i + 1)}</span>${esc(f)}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div>
              <div class="module-box">
                <div class="module-head">
                  <span>${esc(p.snippet && p.snippet.label)}</span>
                  <span>Interactive</span>
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

    rail.innerHTML = PROJECTS.map((p, i) => `
      <button class="specimen-tab" type="button" role="tab" aria-selected="${i === 0}" data-idx="${i}">
        <div class="tab-top">
          <span class="tab-idx-group">
            ${i < 9 ? `<span class="tab-key">${pad(i + 1)}</span>` : ''}
            <span>Project ${pad(i + 1)}</span>
          </span>
          <span>${esc(p.platform)}</span>
        </div>
        <div class="tab-title">${esc(p.formatted_title)}</div>
        <div class="tab-foot">${esc(p.type)}</div>
      </button>
    `).join('');

    rail.querySelectorAll('.specimen-tab').forEach((btn) => {
      btn.addEventListener('click', () => renderStage(Number(btn.dataset.idx)));
    });

    const maxKey = Math.min(9, PROJECTS.length);
    if (isTouchDevice()) {
      const hintEl = document.getElementById('workbench-hint');
      if (hintEl) {
        hintEl.textContent = 'Tap a project above to inspect modules and test a live demo.';
      }
    } else if (maxKey > 0) {
      const rangeText = maxKey === 1 ? '1' : `1–${maxKey}`;
      const rangeEl = document.getElementById('shortcut-range');
      if (rangeEl) rangeEl.textContent = rangeText;
      const legendEl = document.getElementById('keyboard-legend');
      if (legendEl) {
        legendEl.innerHTML = `
          <span><kbd>1</kbd>–<kbd>${maxKey}</kbd> Switch project</span>
          <span><kbd>T</kbd> Theme</span>
          <span><kbd>C</kbd> Color</span>
          <span><kbd>⌘K</kbd> Quick actions</span>
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
    renderStage(initialIdx, { updateHash: resolveHashIndex() !== -1 });

    window.addEventListener('hashchange', () => {
      const idx = resolveHashIndex();
      if (idx !== -1 && idx !== activeIdx) {
        renderStage(idx, { scrollToDeck: true, updateHash: false });
      }
    });

    const totalBytes = LANGS.reduce((sum, l) => sum + Number(l.bytes || 0), 0);
    document.getElementById('total-kb').textContent = `${Math.round(totalBytes / 1024)} KB`;
    document.getElementById('shipped-count').textContent = pad(PROJECTS.length);
    document.getElementById('byte-summary').textContent = `Total source: ${(totalBytes / 1024).toFixed(1)} KB across ${PROJECTS.length} repositories`;

    const stackedBar = document.getElementById('stacked-bar');
    const legend = document.getElementById('lang-legend');
    const calloutEl = document.getElementById('footprint-callout');
    const projectTitleById = new Map(PROJECTS.map((p) => [p.id.toLowerCase(), p.formatted_title]));
    const defaultCalloutText = isTouchDevice()
      ? 'Tap a language segment or row to inspect repository usage'
      : 'Hover or tap a language segment to inspect repository usage';
    if (calloutEl) calloutEl.textContent = defaultCalloutText;

    stackedBar.innerHTML = LANGS.map((l, i) => {
      const pct = totalBytes > 0 ? (l.bytes / totalBytes) * 100 : 0;
      const colorClass = `lang-c-${i % 6}`;
      return `<div class="bar-seg ${colorClass}" data-lang-idx="${i}" style="width:${pct.toFixed(2)}%" title="${esc(l.name)}: ${pct.toFixed(1)}%"></div>`;
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
      calloutEl.textContent = `${l.name} (${pct}% · ${(l.bytes / 1024).toFixed(1)} KB) — Used in ${repoNames || 'N/A'}`;
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
        const idx = Number(target.dataset.langIdx);
        lockedLangIdx = lockedLangIdx === idx ? -1 : idx;
        highlightLang(lockedLangIdx);
      });
    });

    const cmdBackdrop = document.getElementById('cmd-backdrop');
    const cmdInput = document.getElementById('cmd-input');
    const cmdList = document.getElementById('cmd-list');
    const cmdOpen = document.getElementById('cmd-open');
    const cmdClose = document.getElementById('cmd-close');

    const commands = [
      ...PROJECTS.map((p, idx) => ({
        label: `Inspect Project ${pad(idx + 1)}: ${p.formatted_title}`,
        meta: idx < 9 ? `Key ${idx + 1} · ${p.platform}` : p.platform,
        run: () => renderStage(idx, { scrollToDeck: true })
      })),
      { label: 'Cycle Accent Color Palette', meta: 'Key C', run: cyclePalette },
      { label: 'Toggle Theme (Light / Dark)', meta: 'Key T', run: toggleTheme },
      { label: 'Print Specification Sheet (A4)', meta: 'Ctrl+P', run: () => window.print() },
      {
        label: 'Copy GitHub Profile Link',
        meta: 'Clipboard',
        run: () => copyTextToClipboard(sanitizeUrl(PROFILE.html_url, 'https://github.com/vishn0o'), copyLabelEl, 'Copy Profile Link')
      },
      {
        label: 'Open LinkedIn Profile',
        meta: 'External',
        run: () => window.open('https://www.linkedin.com/in/vishn0o/', '_blank', 'noopener,noreferrer')
      },
      ...(CONTACT.email ? [{
        label: `Copy Contact Email (${CONTACT.email})`,
        meta: 'Clipboard',
        run: () => copyTextToClipboard(CONTACT.email, null, '')
      }] : []),
      {
        label: 'Open GitHub Profile (@vishn0o)',
        meta: 'External',
        run: () => window.open(sanitizeUrl(PROFILE.html_url, 'https://github.com/vishn0o'), '_blank', 'noopener,noreferrer')
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
        : `<li class="cmd-item"><span>No matching actions</span></li>`;

      cmdList.querySelectorAll('.cmd-item[data-idx]').forEach((el) => {
        el.addEventListener('click', () => {
          const cmd = filteredCmds[Number(el.dataset.idx)];
          closeCmd();
          if (cmd) cmd.run();
        });
      });
    };

    const openCmd = () => {
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
      } else if (e.key.toLowerCase() === 'c') {
        cyclePalette();
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
    .catch(() => readFallbackSnapshot())
    .then((data) => {
      if (!data) {
        stageEl.innerHTML = `<div class="artifact-bar"><span class="artifact-copy">Unable to load repository metadata.</span></div>`;
        return;
      }
      return syncLiveGitHubData(data).then(initWorkbench);
    });
})();
