// Collects popular, recently active GitHub repositories and stores them in Supabase.
// Runs in GitHub Actions. Secrets: GH_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY.

const GH = "https://api.github.com";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GH_TOKEN = process.env.GH_TOKEN;
const SCHEMA = "repo_radar";

// Each category is a GitHub topic query.
const CATEGORIES = [
  { category: "programming", topic: "javascript" },
  { category: "programming", topic: "python" },
  { category: "tools", topic: "cli" },
  { category: "ai", topic: "machine-learning" },
  { category: "data", topic: "data-science" },
  { category: "web", topic: "web-development" },
  { category: "learning", topic: "tutorial" },
  { category: "games", topic: "game-engine" },
];

// Anything matching these terms is skipped entirely: no piracy, cheats, or exploits.
const BLOCKED = [
  "crack", "keygen", "warez", "piracy", "pirate", "cheat", "exploit", "jailbreak",
  "bypass", "rom-hack", "ps4", "ps5", "switch-hack", "malware", "ransomware", "rootkit",
];

const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

function isBlocked(repo) {
  const text = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  return BLOCKED.some((term) => text.includes(term));
}

async function fetchRepos({ category, topic }) {
  const q = `topic:${topic} stars:>20 archived:false fork:false pushed:>${weekAgo}`;
  const url = `${GH}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${GH_TOKEN}`, "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${topic}: ${await res.text()}`);
  const { items } = await res.json();
  return items.map((r) => ({ repo: r, category }));
}

function toRow({ repo, category }) {
  return {
    id: repo.id,
    full_name: repo.full_name,
    name: repo.name,
    owner_login: repo.owner.login,
    description: repo.description,
    html_url: repo.html_url,
    language: repo.language,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count,
    license_spdx: repo.license?.spdx_id ?? null,
    category,
    pushed_at: repo.pushed_at,
    created_at: repo.created_at,
    fetched_at: new Date().toISOString(),
  };
}

async function upsert(rows) {
  if (!rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/repos?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Content-Profile": SCHEMA,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
}

const seen = new Map();
for (const cat of CATEGORIES) {
  const items = await fetchRepos(cat);
  for (const item of items) {
    const { repo } = item;
    if (!repo.description || !repo.license) continue; // skip undocumented or unlicensed projects
    if (isBlocked(repo)) continue;
    if (!seen.has(repo.id)) seen.set(repo.id, toRow(item));
  }
  // Stay well under GitHub's secondary rate limits.
  await new Promise((r) => setTimeout(r, 1500));
}

const rows = [...seen.values()];
await upsert(rows);
console.log(`Saved ${rows.length} repositories.`);
