import { normalizeSearch } from "./core.mjs";

let snapshot;
export function loadSnapshot() {
  if (!snapshot) snapshot = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "./assets/catalog-snapshot.json");
    xhr.timeout = 10000;
    xhr.onload = () => {
      try {
        if (xhr.status !== 200) throw new Error("Backup HTTP " + xhr.status);
        const data = JSON.parse(xhr.responseText);
        if (!Array.isArray(data.rows) || !data.rows.length || typeof data.generated_at !== "string")
          throw new Error("Invalid catalog backup");
        resolve(data);
      } catch (error) { reject(error); }
    };
    xhr.onerror = xhr.ontimeout = () => reject(new Error("Backup request failed"));
    xhr.send();
  }).catch(error => { snapshot = null; throw error; });
  return snapshot;
}

export function filterSnapshot(rows, state) {
  const q = normalizeSearch(state.search).toLowerCase();
  const term = q.replace(/[\s_.-]+/g, "");
  const numeric = key => (a,b) => (b[key] || 0) - (a[key] || 0);
  const timestamp = key => (a,b) => (b[key] || "").localeCompare(a[key] || "");
  const order = {
    popular: numeric("stars"), least:(a,b) => numeric("stars")(b,a),
    recent:timestamp("pushed_at"), newest:timestamp("created_at"), forked:numeric("forks_count")
  };
  return rows.filter(row => {
    if (state.category !== "all" && row.category !== state.category) return false;
    if (state.language && row.language !== state.language) return false;
    if (!q) return true;
    const owner = row.owner_login.toLowerCase();
    if (q[0] === "@") return owner === q.slice(1);
    const name = row.name.toLowerCase();
    return owner === q || row.full_name.toLowerCase() === q || name.includes(q) ||
      (!!term && name.replace(/[\s_.-]+/g, "").includes(term)) ||
      (state.includeDescription && [row.description || "", ...(row.topics || [])]
        .some(text => text.toLowerCase().includes(q)));
  }).sort((a,b) => (order[state.sort] || order.popular)(a,b) || b.id-a.id);
}
