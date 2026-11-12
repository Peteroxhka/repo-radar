// Curated discovery from GitHub search. Never bulk-import incomplete /repositories entries.
import {isConsoleWebKit, trustedGitHubPagesSite} from "../lib/catalog.mjs";
import {buildDiscoveryPlan,discoverySlot} from "../lib/discovery-plan.mjs";
const API="https://api.github.com";
const BASE=process.env.SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_KEY;
const TOKEN=process.env.GH_TOKEN;
if(!BASE||!KEY||!TOKEN)throw new Error("Missing Supabase or GitHub Actions credentials.");

const QUERIES=[
 ["console_webkit","webkit ps4 in:name,description"],
 ["console_webkit","webkit ps5 in:name,description"],
 ["console_webkit","webkit playstation in:name,description"],
 ["console_webkit","webkit ps3 in:name,description"],
 ["console_webkit","webkit ps vita in:name,description"],
 ["console_webkit","webkit wii u in:name,description"],
 ["console_webkit","webkit xbox in:name,description"],
 ["console_webkit","webkit nintendo switch in:name,description"],
 ["games","ps4 in:name"],["games","topic:ps4"],["ai","chatgpt in:name"],
 ["games","minecraft in:name"],["games","ps3 in:name"],["ai","ollama in:name"],
 ["programming","topic:javascript"],["programming","topic:python"],
 ["tools","topic:developer-tools"],["tools","topic:cli"],
 ["ai","topic:machine-learning"],["ai","topic:llm"],
 ["data","topic:data-science"],["data","topic:database"],
 ["web","topic:web-development"],["web","topic:frontend"],
 ["learning","topic:tutorial"],["learning","topic:education"],
 ["games","topic:game-engine"],["games","topic:gamedev"],
 ["tools","telegram in:name"],["tools","discord in:name"],
 ["programming","linux in:name"],["programming","rust in:name"],
 ["web","react in:name"],["web","flutter in:name"],
 ["tools","api in:name"],["tools","bot in:name"],
 ["data","postgres in:name"]
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function classify(repo,fallback){
 if(isConsoleWebKit(repo))return "console_webkit";
 const topics=(repo.topics||[]).join(" ").toLowerCase();
 const text=`${repo.name||""} ${repo.description||""} ${topics}`.toLowerCase();
 if(/\b(llm|chatgpt|ollama|machine.learning|artificial.intelligence|neural.network)\b/i.test(text))return "ai";
 if(/\b(database|postgres|data.science|analytics|dataset|big.data)\b/i.test(text))return "data";
 if(/\b(ps4|ps3|minecraft|game.engine|gamedev|unity|godot|unreal)\b/i.test(text))return "games";
 if(/\b(tutorial|course|education|learning|roadmap)\b/i.test(text))return "learning";
 if(/\b(react|vue|angular|svelte|frontend|web.development|website|nextjs)\b/i.test(text))return "web";
 if(/\b(cli|terminal|devtools|developer.tools|command.line|bot)\b/i.test(text))return "tools";
 return fallback|| (repo.language?"programming":"other");
}
function row(repo,category){
 return {id:repo.id,full_name:repo.full_name,name:repo.name,
 owner_login:repo.owner?.login||repo.full_name.split("/")[0],
 description:repo.description||null,html_url:repo.html_url,
 language:repo.language||null,topics:Array.isArray(repo.topics)?repo.topics:[],
 stars:repo.stargazers_count||0,license_spdx:repo.license?.spdx_id||null,
 category:classify(repo,category),pushed_at:repo.pushed_at||null,
 created_at:repo.created_at||null,fetched_at:new Date().toISOString(),
 is_fork:false,is_archived:false,forks_count:repo.forks_count||0,
 watchers_count:repo.subscribers_count||0,open_issues_count:repo.open_issues_count||0,
 default_branch:repo.default_branch||null,homepage:repo.homepage||null,
 updated_at:repo.updated_at||null};
}
async function getJson(url){
 for(let i=0;i<4;i++){
  const res=await fetch(url,{headers:{Accept:"application/vnd.github+json",
   Authorization:`Bearer ${TOKEN}`,"X-GitHub-Api-Version":"2026-03-10",
   "User-Agent":"Repo-Radar-Collector"},signal:AbortSignal.timeout(30000)});
  if(res.ok)return res.json();
  const details=(await res.text()).slice(0,500);
  if(![403,429,500,502,503,504].includes(res.status)||i===3)
   throw Error(`GitHub search ${res.status}: ${details}`);
  const remaining=res.headers.get("x-ratelimit-remaining");
  const reset=Number(res.headers.get("x-ratelimit-reset")||0)*1000;
  const retry=Number(res.headers.get("retry-after")||0)*1000;
  await sleep(Math.max(2500,retry,remaining==="0"?reset-Date.now():0,2**i*2500));
 }
}
// Small, independently committed batches avoid PostgreSQL statement timeouts.
// Retry transient failures, split timed-out batches, and never report success
// when any collected repository has not reached Supabase.
async function upsertBatch(part){
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await fetch(`${BASE}/rest/v1/repos?on_conflict=id`,{
    method:"POST",headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,
     "Content-Type":"application/json","Content-Profile":"repo_radar",
     Prefer:"resolution=merge-duplicates,return=minimal"},
    body:JSON.stringify(part),signal:AbortSignal.timeout(60000)});
   if(res.ok)return;
   const detail=(await res.text()).slice(0,1200);
   lastError=new Error(`Supabase upsert ${res.status}: ${detail}`);
   // A query timeout is generally caused by batch size; split immediately.
   if(part.length>1&&(res.status===500||detail.includes("57014")))break;
   if(![408,429,500,502,503,504].includes(res.status))throw lastError;
  }catch(error){
   lastError=error;
   if(error.message?.includes("Supabase upsert 4")&&!error.message.includes("429"))throw error;
  }
  if(attempt<2)await sleep(1200*2**attempt);
 }
 if(part.length>1){
  const middle=Math.floor(part.length/2);
  await upsertBatch(part.slice(0,middle));
  await upsertBatch(part.slice(middle));
  return;
 }
 throw lastError??Error("Single-row Supabase upsert failed");
}
async function upsert(rows){
 for(let i=0;i<rows.length;i+=12)await upsertBatch(rows.slice(i,i+12));
}
// Guaranteed hand-picked project entries, regardless of stars.
// Keep this list intentionally small; it is not an account-wide bulk import.
const featuredOriginals=[
 {fullName:"dnestruev/messenger",category:"tools",
  homepage:"https://dnestruev.github.io/messenger/",
  fallbackDescription:"Веб-мессенджер для обмена сообщениями"},
 {fullName:"Peteroxhka/repo-radar",category:"web",
  homepage:"https://peteroxhka.github.io/repo-radar/",
  fallbackDescription:"Каталог проектов GitHub с поиском, категориями и сообществом"},
 {fullName:"Akela-x/ps4freeforall",category:"console_webkit",
  homepage:"https://akela-x.github.io/ps4freeforall/",
  fallbackDescription:"PS4 WebKit — интерактивная страница проекта"}
];
async function syncFeaturedOriginals(){
 const toSave=[];
 for(const item of featuredOriginals){
  const repo=await getJson(`${API}/repos/${item.fullName}`);
  if(!repo.id||!repo.full_name||repo.full_name.toLowerCase()!==item.fullName.toLowerCase()||repo.fork||repo.archived||repo.private)
   throw new Error(`Featured repository is unavailable or ineligible: ${item.fullName}`);
  const entry=row(repo,item.category);
  entry.homepage=item.homepage;
  entry.description=repo.description||item.fallbackDescription;
  toSave.push(entry);
 }
 await upsert(toSave);
 console.log(`Saved ${toSave.length} featured original repositories`);
}
await syncFeaturedOriginals();

const recent=discoverySlot();
const sort=recent%3===0?"updated":"stars";
const jobs=buildDiscoveryPlan(QUERIES,recent);
console.log(`Discovery plan: ${jobs.length} searches, ${jobs.filter(x=>x.track==="rotating").length} rotating topics, ${jobs.filter(x=>x.track==="deep").length} deeper pages, sorting by ${sort}`);
const collected=new Map();
const persisted=new Set();
let successful=0,failed=0;
for(const {category,search,page,track} of jobs){
 const q=`${search} fork:false archived:false stars:>=2`;
 const url=`${API}/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=100&page=${page}`;
 try{
  const results=await getJson(url);
  successful++;
  const fresh=[];
  for(const repo of results.items||[]){
   if(!repo.id||!repo.name||!repo.html_url||repo.fork||repo.archived||repo.private)continue;
   // Preserve rare console-WebKit projects even when descriptions are sparse,
   // but don't fill other categories with empty low-star placeholders.
   if((repo.description||"").trim().length<8&&repo.stargazers_count<8&&category!=="console_webkit")continue;
   const entry=row(repo,category);
   // Only actual console WebKit projects may enter this focused category.
   if(category==="console_webkit"&&entry.category!=="console_webkit")continue;
   if(entry.category==="console_webkit"){
    const direct=trustedGitHubPagesSite(repo.homepage);
    if(direct)entry.homepage=direct;
    else if(repo.has_pages){
     try{
      const pages=await getJson(`${API}/repos/${repo.full_name}/pages`);
      entry.homepage=trustedGitHubPagesSite(pages.html_url);
     }catch(error){console.warn(`No public GitHub Pages metadata for ${repo.full_name}: ${error.message}`);}
    }
   }
   collected.set(repo.id,entry);
   if(!persisted.has(repo.id))fresh.push(entry);
  }
  await upsert(fresh);
  for(const item of fresh)persisted.add(item.id);
  console.log(`[${track}] ${search} page ${page}: ${results.items?.length||0} matches, ${fresh.length} eligible saved`);
 }catch(error){
  failed++;
  console.error(`Search failed (${search} page ${page}): ${error.message}`);
 }
 await sleep(2400);
}
if(successful===0||successful<Math.ceil(jobs.length*.7))
 throw new Error(`Discovery incomplete: ${successful}/${jobs.length} searches succeeded, ${failed} failed.`);
console.log(`Discovery complete: ${collected.size} unique eligible original repositories processed, ${successful}/${jobs.length} searches succeeded. Records are upserted by GitHub ID, so repeated sightings do not create duplicates.`);
