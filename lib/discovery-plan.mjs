// Controlled search expansion. Rotate discovery topics and deeper result pages
// rather than repeatedly ingesting only GitHub's first 100 matches.
export const ROTATING_DISCOVERY=[
 ["tools","topic:terminal"],["tools","topic:automation"],["tools","topic:devops"],
 ["tools","topic:productivity"],["tools","topic:docker"],["tools","topic:kubernetes"],
 ["tools","topic:monitoring"],["tools","topic:backup"],["tools","topic:self-hosted"],
 ["tools","topic:git"],["tools","topic:api-client"],["tools","topic:networking"],
 ["tools","topic:linux-tools"],["tools","topic:browser-extension"],
 ["ai","topic:ai-agents"],["ai","topic:generative-ai"],["ai","topic:transformers"],
 ["ai","topic:natural-language-processing"],["ai","topic:computer-vision"],
 ["ai","topic:deep-learning"],["ai","topic:rag"],["ai","topic:local-llm"],
 ["ai","topic:stable-diffusion"],["ai","topic:inference"],
 ["data","topic:data-visualization"],["data","topic:etl"],["data","topic:sql"],
 ["data","topic:postgresql"],["data","topic:sqlite"],["data","topic:redis"],
 ["data","topic:big-data"],["data","topic:business-intelligence"],
 ["data","topic:open-data"],["data","topic:datasets"],
 ["web","topic:nextjs"],["web","topic:svelte"],["web","topic:vue"],
 ["web","topic:angular"],["web","topic:typescript"],["web","topic:css"],
 ["web","topic:astro"],["web","topic:tailwindcss"],
 ["web","topic:static-site-generator"],["web","topic:website-template"],
 ["learning","topic:awesome-list"],["learning","topic:computer-science"],
 ["learning","topic:algorithms"],["learning","topic:learn-to-code"],
 ["learning","topic:documentation"],["learning","topic:programming-exercises"],
 ["learning","topic:educational"],["learning","topic:course"],
 ["games","topic:godot"],["games","topic:unity"],["games","topic:unreal-engine"],
 ["games","topic:game-development"],["games","topic:minecraft-plugin"],
 ["games","topic:emulator"],["games","topic:retro-gaming"],
 ["games","topic:game-modding"],
 ["programming","topic:go"],["programming","topic:rust"],
 ["programming","topic:c-plus-plus"],["programming","topic:java"],
 ["programming","topic:dotnet"],["programming","topic:php"],
 ["programming","topic:swift"],["programming","topic:wasm"],
 ["console_webkit","webkit ps4 in:name,description"], // avoid duplicated with base
 ["console_webkit","webkit ps5 in:name,description"]
];
// The order is intentionally interleaved by group instead of a single category
// per hour; every run adds real variety to the live catalog.
const ROTATING_GROUPS=6,ROTATING_PER_RUN=12;
const CATEGORY_NAMES=new Set(["tools","ai","data","web","learning","games","programming","console_webkit"]);
export function discoverySlot(date=new Date()){
 const value=date instanceof Date?date:new Date(date);
 if(Number.isNaN(value.getTime()))throw Error("Invalid discovery date");
 return Math.floor(value.getTime()/3600000);
}
function rotatedQueries(hourSlot){
 const list=ROTATING_DISCOVERY.filter(([,q])=>!/^webkit ps[45] /.test(q));
 const groups=Array.from({length:ROTATING_GROUPS},()=>[]);
 // Spread each category over all six slots, not all AI in one slot.
 for(let i=0;i<list.length;i++){
  const [category,q]=list[i];
  if(!CATEGORY_NAMES.has(category))throw Error("Invalid category "+category);
  groups[i%ROTATING_GROUPS].push([category,q]);
 }
 const target=((hourSlot%ROTATING_GROUPS)+ROTATING_GROUPS)%ROTATING_GROUPS;
 const current=groups[target];
 // If group length changes, rotating access remains bounded and deterministic.
 return current.slice(0,ROTATING_PER_RUN).map(([category,search])=>({category,search,page:1,track:"rotating"}));
}
export const DEEP_SEARCHES=[
 ["tools","topic:developer-tools"],["tools","topic:cli"],
 ["ai","topic:machine-learning"],["ai","topic:llm"],
 ["data","topic:data-science"],["data","topic:database"],
 ["web","topic:web-development"],["web","topic:frontend"],
 ["learning","topic:tutorial"],["learning","topic:education"],
 ["games","topic:game-engine"],["games","topic:gamedev"],
 ["programming","topic:javascript"],["programming","topic:python"],
 ["tools","api in:name"],["web","react in:name"],
 ["games","minecraft in:name"],["games","topic:ps4"],
 ["ai","chatgpt in:name"],["tools","topic:developer-tools"],
 ["programming","linux in:name"],["tools","bot in:name"],
 ["data","postgres in:name"],["web","flutter in:name"]
];
// Six extra pages per run; across four hourly slots each topic gets one
// extra page and rotates through pages 2, 3, 4 in subsequent cycles.
export function buildDiscoveryPlan(baseQueries,hourSlot=discoverySlot()){
 if(!Number.isInteger(hourSlot))throw Error("hourSlot must be integer");
 const jobs=[],seen=new Set();
 const add=(category,search,page=1,track="base")=>{
  if(!CATEGORY_NAMES.has(category))throw Error("Unsupported category "+category);
  if(!Number.isInteger(page)||page<1||page>10)throw Error("Page out of range");
  const q=search.trim();
  if(!q||q.length>200)throw Error("Invalid search");
  const key=q+"|"+page;
  if(seen.has(key))return;
  seen.add(key);
  jobs.push({category,search:q,page,track});
 };
 for(const [category,q] of baseQueries)add(category,q,1,"base");
 for(const item of rotatedQueries(hourSlot))add(item.category,item.search,1,item.track);
 const slot=((hourSlot%4)+4)%4;
 const cycle=Math.floor(hourSlot/4);
 const page=2+((cycle%3+3)%3);
 for(let i=slot*6;i<slot*6+6;i++){
  const [category,q]=DEEP_SEARCHES[i];
  add(category,q,page,"deep");
 }
 return jobs;
}

/**
 * Eight completed UTC creation days per hour. Walk backward from the date this
 * scan was enabled, then cycle through older days. A date filter avoids
 * repeatedly receiving the same top 1,000 repositories for a broad topic.
 */
const DAY_MS = 86_400_000;
const BACKFILL_START = Date.UTC(2026, 10, 13);
const BACKFILL_DAYS = Math.ceil((BACKFILL_START - Date.UTC(2008, 0, 1)) / DAY_MS);
export function buildBackfillPlan(hourSlot = discoverySlot()) {
  if (!Number.isSafeInteger(hourSlot)) throw new Error("Invalid backfill slot");
  const elapsed = Math.max(0, hourSlot - discoverySlot(BACKFILL_START));
  const days = new Set();
  for (let offset = 0; offset < 8; offset++) {
    const daysAgo = 1 + (elapsed * 8 + offset) % BACKFILL_DAYS;
    days.add(BACKFILL_START - daysAgo * DAY_MS);
  }
  // Rotate one day per run within each historical band, including quiet early years.
  for (const [firstYear, lastYear] of [[2008, 2014], [2014, 2018], [2018, 2022]]) {
    const first = Date.UTC(firstYear, 0, 1);
    const last = Date.UTC(lastYear, 0, 1);
    const length = (last - first) / DAY_MS;
    days.add(last - (1 + elapsed % length) * DAY_MS);
  }
  const jobs = [];
  for (const date of days) {
    const day = new Date(date).toISOString().slice(0, 10);
    for (let page = 1; page <= 10; page++) {
      jobs.push({ category: null, search: `created:${day} size:>=3`, page, track: "backfill" });
    }
  }
  return jobs;
}
