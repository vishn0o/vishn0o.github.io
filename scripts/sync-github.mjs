import fs from 'node:fs';
import path from 'node:path';

const USERNAME = process.env.GITHUB_USERNAME || 'vishn0o';
const TOKEN = process.env.GITHUB_TOKEN || '';
const SPECIMENS_PATH = path.resolve('data/specimens.json');
const OVERRIDES_PATH = path.resolve('data/overrides.json');

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'vishn0o-portfolio-sync',
  ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
};

async function ghFetch(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}: ${await res.text()}`);
  }
  return res.json();
}

function classifyPlatform(repo, languages) {
  const langs = Object.keys(languages);
  const topics = (repo.topics || []).map(t => t.toLowerCase());
  if (langs.includes('Kotlin') || topics.includes('android')) {
    return { platform: 'ANDROID', type: 'Android Application', footprint: 'ROOM + COMPOSE', artifact_type: 'code-preview' };
  }
  if (langs.includes('Rust') || topics.includes('desktop-app')) {
    return { platform: 'RUST DESKTOP', type: 'Desktop Application', footprint: 'SINGLE BINARY / SQLITE', artifact_type: 'code-preview' };
  }
  if (langs.includes('PowerShell') || topics.includes('windows')) {
    return { platform: 'WIN32 TRAY', type: 'Windows Utility', footprint: 'ZERO-DEPENDENCY SCRIPT', artifact_type: 'code-preview' };
  }
  if (topics.includes('pwa') || topics.includes('offline-first')) {
    return { platform: 'OFFLINE PWA', type: 'Offline Web App', footprint: '0 SERVER / LOCALSTORAGE', artifact_type: 'code-preview' };
  }
  return {
    platform: (repo.language || 'SYSTEMS').toUpperCase(),
    type: 'Software Repository',
    footprint: 'LOCAL-FIRST',
    artifact_type: 'code-preview'
  };
}

function formatTitle(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/^Inkynerd$/i, 'InkyNerd')
    .replace(/^Kathashelf$/i, 'KathaShelf');
}

function extractReadmeSections(mdText, fallbackDesc) {
  if (!mdText) {
    return {
      summary: fallbackDesc || 'Local-first open-source project.',
      features: []
    };
  }
  const clean = mdText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');

  const paragraphs = clean
    .split(/\n\s*\n/)
    .map(p => p.replace(/^#+.*$/gm, '').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 45 && !p.startsWith('|') && !p.startsWith('-'));

  const bullets = clean
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^[-*]\s+/.test(l))
    .map(l => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(l => l.length > 12 && l.length < 180)
    .slice(0, 5);

  return {
    summary: paragraphs[0] || fallbackDesc || 'Local-first open-source project.',
    features: bullets
  };
}

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

async function main() {
  const existingData = readJsonSafe(SPECIMENS_PATH, { profile: {}, featured_projects: [] });
  const overridesData = readJsonSafe(OVERRIDES_PATH, { profile: {}, specimens: {} });

  const existingMap = new Map((existingData.featured_projects || []).map(p => [p.name.toLowerCase(), p]));
  const overrideMap = new Map(
    Object.entries(overridesData.specimens || {}).map(([k, v]) => [k.toLowerCase(), v])
  );

  console.log(`Fetching GitHub profile and repositories for @${USERNAME}...`);
  const user = await ghFetch(`https://api.github.com/users/${USERNAME}`);
  const repos = await ghFetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=30`);

  const ownRepos = repos.filter(
    r => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase() && !r.name.toLowerCase().endsWith('.github.io')
  );

  const langTotals = {};
  const updatedProjects = [];

  for (const repo of ownRepos) {
    const key = repo.name.toLowerCase();
    const languages = await ghFetch(repo.languages_url);
    for (const [lang, bytes] of Object.entries(languages)) {
      if (!langTotals[lang]) langTotals[lang] = { name: lang, bytes: 0, used_in: [] };
      langTotals[lang].bytes += bytes;
      langTotals[lang].used_in.push(key);
    }

    let readmeMd = '';
    try {
      const readmeObj = await ghFetch(`https://api.github.com/repos/${USERNAME}/${repo.name}/readme`);
      if (readmeObj && readmeObj.content) {
        readmeMd = Buffer.from(readmeObj.content, 'base64').toString('utf8');
      }
    } catch (_) {}

    let treeLines = [];
    try {
      const treeObj = await ghFetch(`https://api.github.com/repos/${USERNAME}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`);
      if (treeObj && Array.isArray(treeObj.tree)) {
        treeLines = treeObj.tree
          .filter(node => node.type === 'blob' && !node.path.startsWith('.'))
          .map(node => node.path)
          .slice(0, 9);
      }
    } catch (_) {}

    let latestCommitSha = null;
    try {
      const commits = await ghFetch(`https://api.github.com/repos/${USERNAME}/${repo.name}/commits?per_page=1`);
      if (Array.isArray(commits) && commits[0] && commits[0].sha) {
        latestCommitSha = commits[0].sha.slice(0, 7);
      }
    } catch (_) {}

    const prev = existingMap.get(key) || {};
    const curated = overrideMap.get(key) || {};
    const meta = classifyPlatform(repo, languages);
    const parsedReadme = extractReadmeSections(readmeMd, repo.description);
    const langList = Object.keys(languages);

    updatedProjects.push({
      id: key,
      name: repo.name,
      formatted_title: curated.formatted_title || prev.formatted_title || formatTitle(repo.name),
      type: curated.type || prev.type || meta.type,
      platform: curated.platform || prev.platform || meta.platform,
      year: new Date(repo.created_at).getFullYear().toString(),
      footprint: curated.footprint || prev.footprint || meta.footprint,
      artifact_type: curated.artifact_type || prev.artifact_type || meta.artifact_type,
      description: repo.description || curated.description || prev.description || 'Local-first software repository.',
      readme_summary: curated.readme_summary || prev.readme_summary || parsedReadme.summary,
      problem_solved: curated.problem_solved || prev.problem_solved || repo.description || 'Built to run locally without external cloud dependencies.',
      architecture: curated.architecture || prev.architecture || `Built with ${langList.join(', ') || 'local tooling'}. Stored and executed directly on the user's device.`,
      key_features: (curated.key_features && curated.key_features.length)
        ? curated.key_features
        : ((prev.key_features && prev.key_features.length) ? prev.key_features : (parsedReadme.features.length ? parsedReadme.features : [
            `Primary implementation in ${langList.slice(0, 3).join(', ') || 'native tooling'}`,
            'Zero external cloud account or server dependency',
            `Last updated ${repo.updated_at.slice(0, 10)}`
          ])),
      languages: langList,
      stack: (curated.stack && curated.stack.length)
        ? curated.stack
        : ((prev.stack && prev.stack.length) ? prev.stack : [...new Set([...langList, ...(repo.topics || [])])]),
      latest_commit_sha: latestCommitSha || prev.latest_commit_sha || null,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      homepage: repo.homepage || curated.homepage || prev.homepage || null,
      snippet: curated.snippet || prev.snippet || {
        label: 'REPOSITORY FILE TREE',
        lines: treeLines.length ? treeLines : ['README.md']
      }
    });
  }

  const sortedLanguages = Object.values(langTotals).sort((a, b) => b.bytes - a.bytes);
  const profileOverrides = overridesData.profile || {};

  const nextData = {
    _source: {
      account: user.html_url,
      synced_at: new Date().toISOString(),
      sync_mode: 'GITHUB_ACTIONS // MERGED WITH OVERRIDES.JSON',
      head_commit: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'local-sync',
      note: 'Automatically synced via GitHub Actions and enriched with data/overrides.json.'
    },
    profile: {
      ...existingData.profile,
      ...profileOverrides,
      name: profileOverrides.name || user.name || existingData.profile.name,
      login: user.login,
      bio: profileOverrides.discipline || user.bio || existingData.profile.bio,
      location: profileOverrides.location || user.location || existingData.profile.location,
      avatar_url: existingData.profile.avatar_url || './profile.jpg',
      github_avatar_url: user.avatar_url,
      public_repos: ownRepos.length,
      html_url: user.html_url,
      member_since: new Date(user.created_at).getFullYear()
    },
    featured_projects: updatedProjects,
    tech_matrix: {
      languages: sortedLanguages
    },
    contact: {
      email: profileOverrides.email || user.email || null,
      github: user.html_url,
      repositories: `${user.html_url}?tab=repositories`
    }
  };

  const serialized = JSON.stringify(nextData, null, 2);
  fs.mkdirSync(path.dirname(SPECIMENS_PATH), { recursive: true });
  fs.writeFileSync(SPECIMENS_PATH, serialized + '\n', 'utf8');

  const indexPath = path.resolve('index.html');
  if (fs.existsSync(indexPath)) {
    const idxHtml = fs.readFileSync(indexPath, 'utf8');
    const updatedIdx = idxHtml.replace(
      /(<script id="specimens-fallback" type="application\/json">)[\s\S]*?(<\/script>)/,
      `$1\n${serialized}\n  $2`
    );
    fs.writeFileSync(indexPath, updatedIdx, 'utf8');
  }
  console.log(`Synced ${updatedProjects.length} repositories and ${sortedLanguages.length} languages.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
