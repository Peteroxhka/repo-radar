// Incrementally indexes GitHub's public repository catalog into Supabase.
// GitHub's GET /repositories endpoint is ordered by creation date and paginated by
// the last seen repository ID (since). Its default page is 30 repositories.
// The built-in Actions GITHUB_TOKEN is limited to 1,000 REST requests/hour/repository,
// so each run intentionally uses at most 850 catalog pages plus a few discovery searches.

const GH = "https://api.github.com";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GH_TOKEN = process.env.GH_TOKEN;
const SCHEMA = "repo_radar";
const STATE_KEY = "public_repositories";
const MAX_PAGES_PER_RUN = Number(process.env.MAX_PAGES_PER_RUN || 850);
const FLUSH_SIZE = 300;
const PAGE_DELAY_MS = 1000;

if (!SUPABASE_URL || !SERVICE_KEY || !GH_TOKEN) {
  throw new Error("Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or GH_TOKEN.");
}
if (!Number.isInteger(MAX_PAGES_PER_RUN) || MAX_PAGES_PER_RUN < 1 || MAX_PAGES_PER_RUN > 900) {
  throw new Error("MAX_PAGES_PER_RUN must be an integer between 1 and 900.");
}

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function categoryFor(repo) {
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  const text = `${repo.name ?? ""} ${repo.description ?? ""} ${topics.join(" ")} ${repo.language ?? ""}`.toLowerCase();
  if (/machine-learning|deep-learning|artificial-intelligence|\bai\b|llm|large-language-model/.test(text)) return "ai";
  if (/data-science|database|analytics|data-engineering|big-data/.test(text)) return "data";
  if (/web-development|frontend|backend|react|vue|angular|svelte|nextjs|html|css/.test(text)) return "web";
  if (/game-engine|game-development|gamedev|godot|unreal-engine|unity/.test(text)) return "games";
  if (/tutorial|course|learning|education|roadmap|awesome-list/.test(text)) return "learning";
  if (/command-line|commandline|terminal|cli|developer-tools|devtools|tooling/.test(text)) return "tools";
  if (repo.language) return "programming";
  return "other";
}

function toRow(repo, forcedCategory = null) {
  const topics = Array.isArray(repo.topics) ? repo.topics.filter((x) => typeof x === "string") : [];
  return {
    id: repo.id,
    full_name: repo.full_name,
    name: repo.name,
    owner_login: repo.owner?.login ?? repo.full_name?.split("/")[0] ?? "unknown",
    description: repo.description ?? null,
    html_url: repo.html_url,
    language: repo.language ?? null,
    topics,
    stars: Number(repo.stargazers_count ?? repo.stars ?? 0),
    license_spdx: repo.license?.spdx_id ?? null,
    category: forcedCategory || categoryFor(repo),
    pushed_at: repo.pushed_at ?? null,
    created_at: repo.created_at ?? null,
    fetched_at: new Date().toISOString(),
    is_fork: Boolean(repo.fork),
    is_archived: Boolean(repo.archived),
    forks_count: Number(repo.forks_count ?? repo.forks ?? 0),
    watchers_count: Number(repo.watchers_count ?? repo.watchers ?? 0),
    open_issues_count: Number(repo.open_issues_count ?? repo.open_issues ?? 0),
    default_branch: repo.default_branch ?? null,
    homepage: repo.homepage || null,
    updated_at: repo.updated_at ?? null,
  };
}

async function requestJson(url, label = "GitHub API") {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GH_TOKEN}`,
          "X-GitHub-Api-Version": "2026-03-10",
          "User-Agent": "Repo-Radar-Catalog-Collector",
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      if (attempt === 4) throw new Error(`${label} network error: ${error.message}`);
      await sleep(1000 * (2 ** attempt));
      continue;
    }

    if (response.ok) return { data: await response.json(), headers: response.headers };

    const detail = await response.text();
    const rateLimited = response.status === 403 || response.status === 429;
    const transient = response.status >= 500;
    if (!rateLimited && !transient) {
      throw new Error(`${label} ${response.status}: ${detail.slice(0, 1200)}`);
    }
    if (attempt === 4) throw new Error(`${label} ${response.status}: ${detail.slice(0, 1200)}`);

    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const remaining = response.headers.get("x-ratelimit-remaining");
    const resetAt = Number(response.headers.get("x-ratelimit-reset") || 0);
    let waitMs = Math.max(1000, retryAfter * 1000, 1000 * (2 ** attempt));
    if (remaining === "0" && resetAt > 0) waitMs = Math.max(waitMs, resetAt * 1000 - Date.now());
    console.warn(`${label} rate/temporary limit (${response.status}); waiting ${Math.ceil(waitMs / 1000)}s.`);
    await sleep(waitMs);
  }
  throw new Error(`${label} failed after retries.`);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Content-Profile": SCHEMA,
    "Accept-Profile": SCHEMA,
    ...extra,
  };
}

async function readCursor() {
  const url = `${SUPABASE_URL}/rest/v1/collector_state?key=eq.${encodeURIComponent(STATE_KEY)}&select=last_repo_id`;
  const response = await fetch(url, { headers: supabaseHeaders(), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Supabase cursor read ${response.status}: ${await response.text()}`);
  const rows = await response.json();
  return Number(rows[0]?.last_repo_id ?? 0);
}

async function saveCursor(cursor) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/collector_state?on_conflict=key`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify([{ key: STATE_KEY, last_repo_id: cursor, updated_at: new Date().toISOString() }]),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Supabase cursor save ${response.status}: ${await response.text()}`);
}

async function upsertRows(rows) {
  if (!rows.length) return;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/repos?on_conflict=id`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Supabase repository upsert ${response.status}: ${await response.text()}`);
}

function nextCursorFromLink(link) {
  if (!link) return null;
  const next = link.split(",").find((part) => /rel="next"/i.test(part));
  if (!next) return null;
  const target = next.match(/<([^>]+)>/)?.[1];
  if (!target) return null;
  const value = Number(new URL(target).searchParams.get("since"));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

async function importPublicCatalog() {
  let cursor = await readCursor();
  let pending = [];
  let pendingCursor = cursor;
  let pages = 0;
  let received = 0;
  let finished = false;

  console.log(`Starting public GitHub catalog import after repository ID ${cursor}.`);

  async function flush() {
    if (!pending.length) return;
    await upsertRows(pending);
    await saveCursor(pendingCursor);
    console.log(`Committed ${pending.length} repositories; cursor is now ${pendingCursor}.`);
    pending = [];
    cursor = pendingCursor;
  }

  while (pages < MAX_PAGES_PER_RUN && !finished) {
    const { data, headers } = await requestJson(
      `${GH}/repositories?since=${cursor === pendingCursor ? cursor : pendingCursor}`,
      "GitHub public repositories",
    );
    if (!Array.isArray(data)) throw new Error("GitHub /repositories returned an unexpected payload.");
    if (data.length === 0) {
      finished = true;
      break;
    }

    const ids = data.map((repo) => Number(repo.id)).filter(Number.isSafeInteger);
    if (ids.length !== data.length) throw new Error("GitHub returned a repository without a valid numeric ID.");
    const pageLastId = Math.max(...ids);
    if (pageLastId <= pendingCursor) throw new Error(`GitHub cursor did not advance (current ${pendingCursor}, received ${pageLastId}).`);

    pending.push(...data.map((repo) => toRow(repo)));
    pendingCursor = nextCursorFromLink(headers.get("link")) ?? pageLastId;
    if (pendingCursor <= cursor) throw new Error(`GitHub next cursor did not advance beyond ${cursor}.`);

    pages += 1;
    received += data.length;

    if (pending.length >= FLUSH_SIZE) await flush();

    if (data.length < 30 || !headers.get("link")?.includes('rel="next"')) finished = true;
    if (!finished && pages < MAX_PAGES_PER_RUN) await sleep(PAGE_DELAY_MS);
  }

  await flush();
  console.log(`Public catalog pass complete: ${received} repositories read across ${pages} pages. Last committed ID: ${cursor}. ${finished ? "Reached current end of GitHub's public list." : "More repositories remain; next workflow run will continue from this cursor."}`);
  return { pages, received, cursor };
}

async function refreshDiscoveryFeed() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const seen = new Map();

  for (const item of CATEGORIES) {
    const q = `topic:${item.topic} stars:>20 archived:false fork:false pushed:>${weekAgo}`;
    const url = `${GH}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`;
    const { data } = await requestJson(url, `GitHub discovery search (${item.topic})`);
    for (const repo of data.items ?? []) {
      if (repo.id && repo.full_name && repo.html_url && !seen.has(repo.id)) {
        seen.set(repo.id, toRow(repo, item.category));
      }
    }
    await sleep(1200);
  }

  const rows = [...seen.values()];
  await upsertRows(rows);
  console.log(`Refreshed ${rows.length} currently popular discovery repositories.`);
}

const imported = await importPublicCatalog();
await refreshDiscoveryFeed();
console.log(`Repo Radar import finished. ${imported.received} public repositories scanned this run; cursor=${imported.cursor}.`);
