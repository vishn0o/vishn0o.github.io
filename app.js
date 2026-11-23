/* VISHN0O // SPECIMEN WORKBENCH — Award-Craft Edition (Zero dependencies) */
(() => {
  'use strict';

  const DATA = JSON.parse(document.getElementById('github-data').textContent);
  const PROJECTS = DATA.featured_projects || [];
  const LANGS = (DATA.tech_matrix && DATA.tech_matrix.languages) || [];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- 1. Dual Theme Switcher (E-Ink Paper / Oscilloscope Dark) ---------- */
  const htmlEl = document.documentElement;
  const themeMeta = document.getElementById('theme-meta');
  const toggleBtn = document.getElementById('theme-toggle');

  const setTheme = (mode) => {
    htmlEl.setAttribute('data-theme', mode);
    themeMeta.setAttribute('content', mode === 'dark' ? '#0B0C0E' : '#F2F0EA');
    toggleBtn.querySelectorAll('.opt').forEach(el => {
      el.classList.toggle('active', el.dataset.mode === mode);
    });
    try { localStorage.setItem('vishn0o_theme', mode); } catch (_) {}
  };

  try {
    const saved = localStorage.getItem('vishn0o_theme');
    if (saved === 'dark' || saved === 'paper') setTheme(saved);
  } catch (_) {}

  const toggleTheme = () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'paper' : 'dark';
    setTheme(next);
  };
  toggleBtn.addEventListener('click', toggleTheme);

  /* ---------- 2. Live Telemetry Clock & Subtle Cursor Coordinate HUD ---------- */
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

  const coordEl = document.getElementById('coord-readout');
  if (coordEl && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      coordEl.textContent = `X:${String(e.clientX).padStart(3, '0')} Y:${String(e.clientY).padStart(3, '0')}`;
    }, { passive: true });
  }

  /* Subtle Magnetic Button Micro-Interaction */
  if (window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.14;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- 3. Copy Profile URL ---------- */
  const copyBtn = document.getElementById('copy-profile');
  const copyProfileUrl = async () => {
    const url = DATA.profile.html_url;
    try { await navigator.clipboard.writeText(url); }
    catch (_) {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    copyBtn.textContent = 'COPIED TO CLIPBOARD ✓';
    setTimeout(() => { copyBtn.textContent = 'COPY PROFILE URL'; }, 2000);
  };
  copyBtn.addEventListener('click', copyProfileUrl);

  /* ---------- 4. Interactive Mini-Artifact Renderers ---------- */
  const renderArtifact = (id) => {
    if (id === 'inkynerd') {
      return `
        <div class="artifact-box">
          <div class="artifact-head">
            <span>LIVE WIDGET PREVIEW // SWITCH VISUAL STYLE</span>
            <span>4×2 HOME-SCREEN SURFACE</span>
          </div>
          <div class="pill-row" id="inky-styles">
            <button type="button" class="mini-pill active" data-style="eink">E-Ink</button>
            <button type="button" class="mini-pill" data-style="swiss">Swiss</button>
            <button type="button" class="mini-pill" data-style="glass">Glass</button>
            <button type="button" class="mini-pill" data-style="dot">Dot</button>
            <button type="button" class="mini-pill" data-style="almanac">Almanac</button>
          </div>
          <div class="inky-preview style-eink" id="inky-card">
            <div style="font-size:10px;letter-spacing:.08em;opacity:.75;margin-bottom:6px;">WIKIPEDIA TRIVIA · CACHED IN ROOM</div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px;">The Great Emu War (1932)</div>
            <div style="font-size:12.5px;line-height:1.55;">Royal Australian Artillery soldiers deployed with Lewis machine guns in Western Australia failed to curb the emu population.</div>
          </div>
        </div>`;
    }
    if (id === 'kathashelf') {
      return `
        <div class="artifact-box">
          <div class="artifact-head">
            <span>THALIR (തളിർ) BILINGUAL SHELF SPECIMEN</span>
            <span>BUNDLED MANJARI + LORA · ZERO NETWORK</span>
          </div>
          <div class="katha-card">
            <div class="katha-book">
              <div class="katha-lang">MALAYALAM // LOCAL SQLITE</div>
              <div class="katha-title">ഖസാക്കിന്റെ ഇതിഹാസം</div>
              <div style="font-size:12px;color:var(--ink-secondary);">ഒ.വി. വിജയൻ · ★★★★★ · 100% READ</div>
            </div>
            <div class="katha-book">
              <div class="katha-lang">ENGLISH // LOCAL SQLITE</div>
              <div class="katha-title">The Design of Everyday Things</div>
              <div style="font-size:12px;color:var(--ink-secondary);">Don Norman · ★★★★½ · READING (68%)</div>
            </div>
          </div>
        </div>`;
    }
    if (id === 'study-hub') {
      return `
        <div class="artifact-box">
          <div class="artifact-head">
            <span>SM-2 SPACED REPETITION ENGINE DEMO</span>
            <span>CONFIDENCE-WEIGHTED SCORING</span>
          </div>
          <div class="sm2-card">
            <div class="sm2-q">Q: Why does SQLite WAL mode improve concurrent local reads?</div>
            <div class="sm2-a">Readers do not block writers and writers do not block readers because changes append to a separate write-ahead log.</div>
            <div class="pill-row" id="sm2-actions" style="margin-bottom:0;">
              <button type="button" class="mini-pill" data-rate="AGAIN → Relearn in 10 mins (0× marks)">Again</button>
              <button type="button" class="mini-pill" data-rate="FUZZY → Next review in 1 day (0.5× marks)">Fuzzy</button>
              <button type="button" class="mini-pill" data-rate="GOOD → Next review in 3 days (1.0× marks)">Good</button>
            </div>
            <div class="sm2-status" id="sm2-status">RATE RECALL ABOVE TO SIMULATE INTERVAL SCHEDULER</div>
          </div>
        </div>`;
    }
    if (id === 'cat-water-reminder') {
      return `
        <div class="artifact-box">
          <div class="artifact-head">
            <span>WINFORMS TRAY POPUP SIMULATOR</span>
            <span>IDLE FOOTPRINT: ~13 MB RAM</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
            <span style="font-size:12.5px;color:var(--ink-secondary);">Trigger a simulated desktop tray hydration popup in the bottom-right corner:</span>
            <button type="button" class="btn primary" id="spawn-cat-btn">SPAWN TRAY CAT POPUP</button>
          </div>
        </div>`;
    }
    return `
      <div class="artifact-box">
        <div class="artifact-head">
          <span>REPOSITORY TELEMETRY // AUTO-SYNCED SPECIMEN</span>
          <span>LOCAL-FIRST ARCHITECTURE</span>
        </div>
        <div style="font-size:12.5px;color:var(--ink-secondary);line-height:1.6;">
          Synced automatically from GitHub REST API. Inspect the repository file tree and stack tags below, or open the source directly.
        </div>
      </div>`;
  };

  /* ---------- 5. Master-Detail Specimen Deck ---------- */
  const rail = document.getElementById('specimen-rail');
  const stage = document.getElementById('specimen-stage');

  const bindArtifactEvents = (id) => {
    if (id === 'inkynerd') {
      const pills = stage.querySelectorAll('#inky-styles .mini-pill');
      const card = document.getElementById('inky-card');
      pills.forEach(btn => {
        btn.addEventListener('click', () => {
          pills.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          card.className = `inky-preview style-${btn.dataset.style}`;
        });
      });
    } else if (id === 'study-hub') {
      const status = document.getElementById('sm2-status');
      stage.querySelectorAll('#sm2-actions .mini-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          status.textContent = btn.dataset.rate;
        });
      });
    } else if (id === 'cat-water-reminder') {
      const spawnBtn = document.getElementById('spawn-cat-btn');
      const toast = document.getElementById('cat-toast');
      const msgEl = document.getElementById('cat-toast-msg');
      const quips = [
        'Meow. Drink a glass of water before your next compile.',
        'Hydration check: your RAM is at 13 MB, your water intake is at 0.',
        'Click me to log a glass, or snooze 10 minutes.'
      ];
      spawnBtn.addEventListener('click', () => {
        msgEl.textContent = quips[Math.floor(Math.random() * quips.length)];
        toast.hidden = false;
      });
    }
  };

  const renderStage = (idx, scrollToDeck = false) => {
    const p = PROJECTS[idx];
    if (!p) return;

    rail.querySelectorAll('.specimen-tab').forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === idx));
    });

    stage.innerHTML = `
      <div class="stage-animate">
        <div class="stage-header">
          <div>
            <div class="stage-kicker">SPECIMEN ${pad(idx + 1)} // ${esc(p.platform)} · ${esc(p.footprint)}</div>
            <h3 class="stage-title">${esc(p.formatted_title)}</h3>
          </div>
          <div class="stage-links">
            <a class="btn primary" href="${esc(p.html_url)}" target="_blank" rel="noopener">SOURCE CODE ↗</a>
            ${p.homepage ? `<a class="btn" href="${esc(p.homepage)}" target="_blank" rel="noopener">LIVE APP ↗</a>` : ''}
          </div>
        </div>

        <p class="stage-summary">${esc(p.readme_summary)}</p>

        ${renderArtifact(p.id)}

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
              <div class="module-head">${esc(p.snippet && p.snippet.label)}</div>
              <pre>${(p.snippet && p.snippet.lines || []).map(l => esc(l)).join('\n')}</pre>
            </div>
            <div class="stack-tags">
              ${(p.stack || []).map(t => `<span>${esc(t)}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    bindArtifactEvents(p.id);
    if (scrollToDeck) {
      document.getElementById('workbench').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  rail.innerHTML = PROJECTS.map((p, i) => `
    <button class="specimen-tab" type="button" role="tab" aria-selected="${i === 0}" data-idx="${i}">
      <div class="tab-top">
        <span class="tab-idx">SPECIMEN_${pad(i + 1)}</span>
        <span>${esc(p.platform)}</span>
      </div>
      <div class="tab-title">${esc(p.formatted_title)}</div>
      <div class="tab-foot">${esc(p.type)}</div>
    </button>
  `).join('');

  rail.querySelectorAll('.specimen-tab').forEach(btn => {
    btn.addEventListener('click', () => renderStage(Number(btn.dataset.idx)));
  });

  renderStage(0);

  /* ---------- 6. Cat Toast Controls ---------- */
  let glasses = 0;
  const catToast = document.getElementById('cat-toast');
  document.getElementById('cat-toast-close').addEventListener('click', () => { catToast.hidden = true; });
  document.getElementById('cat-snooze').addEventListener('click', () => { catToast.hidden = true; });
  document.getElementById('cat-log-glass').addEventListener('click', () => {
    glasses += 1;
    document.getElementById('glass-count').textContent = String(glasses);
    document.getElementById('cat-toast-msg').textContent = `Logged! Total water tally: ${glasses} glass${glasses === 1 ? '' : 'es'}.`;
  });

  /* ---------- 7. Proportional Language Footprint ---------- */
  const totalBytes = LANGS.reduce((sum, l) => sum + Number(l.bytes || 0), 0);
  document.getElementById('total-kb').textContent = `${Math.round(totalBytes / 1024)} KB`;
  document.getElementById('shipped-count').textContent = pad(PROJECTS.length);
  document.getElementById('byte-summary').textContent = `TOTAL SOURCE: ${(totalBytes / 1024).toFixed(1)} KB ACROSS ${PROJECTS.length} REPOS`;

  const palette = ['#D93800', '#121211', '#4E4D49', '#8A8880', '#B5B2A8', '#2563EB', '#059669', '#7C3AED', '#DB2777'];
  const stackedBar = document.getElementById('stacked-bar');
  const legend = document.getElementById('lang-legend');

  stackedBar.innerHTML = LANGS.map((l, i) => {
    const pct = totalBytes > 0 ? (l.bytes / totalBytes) * 100 : 0;
    const color = palette[i % palette.length];
    return `<div class="bar-seg" style="width:${pct.toFixed(2)}%;background:${color};" title="${esc(l.name)}: ${pct.toFixed(1)}%"></div>`;
  }).join('');

  legend.innerHTML = LANGS.map((l, i) => {
    const pct = totalBytes > 0 ? ((l.bytes / totalBytes) * 100).toFixed(1) : '0.0';
    const kb = (l.bytes / 1024).toFixed(1);
    const color = palette[i % palette.length];
    return `
      <div class="legend-item">
        <span class="legend-left"><span class="swatch" style="background:${color};"></span>${esc(l.name)}</span>
        <span class="legend-right">${kb} KB · ${pct}%</span>
      </div>`;
  }).join('');

  /* ---------- 8. Command Palette (Ctrl+K / /) & Global Hotkeys ---------- */
  const cmdBackdrop = document.getElementById('cmd-backdrop');
  const cmdInput = document.getElementById('cmd-input');
  const cmdList = document.getElementById('cmd-list');
  const cmdOpen = document.getElementById('cmd-open');
  const cmdClose = document.getElementById('cmd-close');

  const commands = [
    ...PROJECTS.map((p, idx) => ({
      label: `Inspect Specimen ${pad(idx + 1)}: ${p.formatted_title}`,
      meta: p.platform,
      run: () => renderStage(idx, true)
    })),
    { label: 'Toggle Theme (E-Ink Paper / Oscilloscope Dark)', meta: 'KEY: T', run: toggleTheme },
    { label: 'Copy GitHub Profile URL', meta: 'CLIPBOARD', run: copyProfileUrl },
    { label: 'Open GitHub Profile (@vishn0o)', meta: 'EXTERNAL ↗', run: () => window.open(DATA.profile.html_url, '_blank', 'noopener') },
    { label: 'Jump to Language Byte Footprint', meta: 'SECTION 03', run: () => document.getElementById('telemetry-foot').scrollIntoView({ behavior: 'smooth' }) }
  ];

  let selectedCmd = 0;
  let filteredCmds = [...commands];

  const renderCommands = () => {
    const q = cmdInput.value.trim().toLowerCase();
    filteredCmds = commands.filter(c => !q || c.label.toLowerCase().includes(q) || c.meta.toLowerCase().includes(q));
    selectedCmd = Math.min(selectedCmd, Math.max(0, filteredCmds.length - 1));
    cmdList.innerHTML = filteredCmds.length
      ? filteredCmds.map((c, i) => `
        <li class="cmd-item ${i === selectedCmd ? 'selected' : ''}" role="option" aria-selected="${i === selectedCmd}" data-idx="${i}">
          <span>${esc(c.label)}</span>
          <span class="cmd-meta">${esc(c.meta)}</span>
        </li>`).join('')
      : `<li class="cmd-item"><span>No matching commands</span></li>`;

    cmdList.querySelectorAll('.cmd-item[data-idx]').forEach(el => {
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
    cmdInput.focus();
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
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      const idx = Number(e.key) - 1;
      if (PROJECTS[idx]) renderStage(idx, true);
    }
  });
})();
