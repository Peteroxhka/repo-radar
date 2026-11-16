import { mkdir, readFile, writeFile } from "node:fs/promises";
// config.js is also bundled by the browser build, so use the same public settings.
const config = await readFile(new URL("../config.js", import.meta.url), "utf8");
const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DATABASE_SCHEMA } =
  await import("data:text/javascript;base64," + Buffer.from(config).toString("base64"));

const columns = "id,name,owner_login,full_name,description,html_url,language,topics,stars,license_spdx,category,pushed_at,created_at,forks_count,homepage,is_fork";
const categories = ["programming","tools","ai","data","web","learning","games","other","console_webkit"];
async function page(category, offset, limit) {
  const params = new URLSearchParams({
    select: columns, category: "eq." + category, admin_hidden: "eq.false",
    is_archived: "eq.false", or: "(is_fork.eq.false,stars.gte.50)",
    order: category === "console_webkit" ? "id.asc" : "stars.desc,id.desc",
    offset: String(offset), limit: String(limit)
  });
  const response = await fetch(SUPABASE_URL + "/rest/v1/repos?" + params, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Accept-Profile": DATABASE_SCHEMA },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error("Could not export " + category + ": HTTP " + response.status);
  return await response.json();
}
const groups = await Promise.all(categories.map(async category => {
  if (category !== "console_webkit") return page(category, 0, 150);
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const batch = await page(category, offset, 500);
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}));
const rows = groups.flat();
if (!rows.length) throw new Error("Catalog snapshot is empty");
await mkdir("assets", { recursive: true });
await writeFile("assets/catalog-snapshot.json", JSON.stringify({ generated_at: new Date().toISOString(), rows }));
console.log("Exported " + rows.length + " public repositories");
