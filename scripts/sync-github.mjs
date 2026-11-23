import fs from 'node:fs';
import path from 'node:path';

const USERNAME = process.env.GITHUB_USERNAME || 'vishn0o';
const TOKEN = process.env.GITHUB_TOKEN || '';
const HTML_PATH = path.resolve('index.html');

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
  if (langs.includes('Kotlin') || topics.includes('android')) return { platform: 'ANDROID', type: 'Android Application', footprint: 'ROOM + COMPOSE' };
  if (langs.includes('Rust') || topics.includes('desktop-app')) return { platform: 'RUST DESKTOP', type: 'Desktop Application', footprint: 'SINGLE BINARY / SQLITE' };
  if (langs.includes('PowerShell') || topics.includes('windows')) return { platform: 'WIN32 TRAY', type: 'Windows Utility', footprint: 'ZERO-DEPENDENCY SCRIPT' };
  if (langs.includes('JavaScript') || langs.includes('TypeScript')) return { platform: 'OFFLINE PWA', type: 'Web / Offline App', footprint: '0 SERVER / LOCALSTORAGE' };
  return { platform: (repo.language || 'SYSTEMS').toUpperCase(), type: 'Software Project', footprint: 'LOCAL-FIRST' };
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

async function main() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const scriptRegex = /(<script id="github-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
  const match = html.match(scriptRegex);
  if (!match) throw new Error('Could not find <script id="github-data"> in index.html');

  const existingData = JSON.parse(match[2]);
  const existingMap = new Map((existingData.featured_projects || []).map(p => [p.name.toLowerCase(), p]));

  console.log(`Fetching GitHub profile and repositories for @${USERNAME}...`);
  const user = await ghFetch(`https://api.github.com/users/${USERNAME}`);
  const repos = await ghFetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=30`);

  const ownRepos = repos.filter(r => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase() && !r.name.toLowerCase().endsWith('.github.io'));
  const langTotals = {};
  const updatedProjects = [];

  for (const repo of ownRepos) {
    const languages = await ghFetch(repo.languages_url);
    for (const [lang, bytes] of Object.entries(languages)) {
      if (!langTotals[lang]) langTotals[lang] = { name: lang, bytes: 0, used_in: [] };
      langTotals[lang].bytes += bytes;
      langTotals[lang].used_in.push(repo.name.toLowerCase());
    }

    let readmeMd = '';
    try {
      const readmeObj = await ghFetch(`https://api.github.com/repos/${USERNAME}/${repo.name}/readme`);
      if (readmeObj && readmeObj.content) {
        readmeMd = Buffer.from(readmeObj.content, 'base64').toString('utf8');
      }
    } catch (_) {
      // Repo may not have a README yet
    }

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

    const prev = existingMap.get(repo.name.toLowerCase()) || {};
    const meta = classifyPlatform(repo, languages);
    const parsedReadme = extractReadmeSections(readmeMd, repo.description);
    const langList = Object.keys(languages);

    updatedProjects.push({
      id: repo.name.toLowerCase(),
      name: repo.name,
      formatted_title: prev.formatted_title || formatTitle(repo.name),
      type: prev.type || meta.type,
      platform: prev.platform || meta.platform,
      year: new Date(repo.created_at).getFullYear().toString(),
      footprint: prev.footprint || meta.footprint,
      description: repo.description || prev.description || 'Local-first software repository.',
      readme_summary: prev.readme_summary || parsedReadme.summary,
      problem_solved: prev.problem_solved || repo.description || 'Built to run locally without external cloud dependencies.',
      architecture: prev.architecture || `Built with ${langList.join(', ') || 'local tooling'}. Stored and executed directly on the user's device.`,
      key_features: (prev.key_features && prev.key_features.length) ? prev.key_features : (parsedReadme.features.length ? parsedReadme.features : [
        `Primary implementation in ${langList.slice(0, 3).join(', ') || 'native tooling'}`,
        'Zero external cloud account or server dependency',
        `Last updated ${repo.updated_at.slice(0, 10)}`
      ]),
      languages: langList,
      stack: (prev.stack && prev.stack.length) ? prev.stack : [...new Set([...langList, ...(repo.topics || [])])],
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      homepage: repo.homepage || prev.homepage || null,
      snippet: prev.snippet || {
        label: 'REPOSITORY FILE TREE',
        lines: treeLines.length ? treeLines : ['README.md']
      }
    });
  }

  const sortedLanguages = Object.values(langTotals).sort((a, b) => b.bytes - a.bytes);

  const nextData = {
    _source: {
      account: user.html_url,
      synced_at: new Date().toISOString(),
      note: 'Automatically synced via GitHub Actions from public repositories.'
    },
    profile: {
      ...existingData.profile,
      name: user.name || existingData.profile.name,
      login: user.login,
      bio: user.bio || existingData.profile.bio,
      location: user.location || existingData.profile.location,
      avatar_url: user.avatar_url,
      public_repos: ownRepos.length,
      html_url: user.html_url,
      member_since: new Date(user.created_at).getFullYear()
    },
    featured_projects: updatedProjects,
    tech_matrix: {
      languages: sortedLanguages
    },
    contact: {
      email: user.email || null,
      github: user.html_url,
      repositories: `${user.html_url}?tab=repositories`
    }
  };

  const formattedJson = '\n' + JSON.stringify(nextData, null, 2) + '\n';
  const updatedHtml = html.replace(scriptRegex, `$1${formattedJson}$3`);

  fs.writeFileSync(HTML_PATH, updatedHtml, 'utf8');
  console.log(`Synced ${updatedProjects.length} repositories and ${sortedLanguages.length} languages into index.html.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
