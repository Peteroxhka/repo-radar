// Curated discovery from GitHub search. Never bulk-import incomplete /repositories entries.
import {isConsoleWebKit, trustedGitHubPagesSite} from "../lib/catalog.mjs";
import {buildDiscoveryPlan,buildBackfillPlan,buildPopularForkPlan,discoverySlot} from "../lib/discovery-plan.mjs";
import {assessProject} from "../lib/repo-quality.mjs";
import {featuredOriginals,trackedOwners,consoleDiscoveryQueries} from "../lib/featured-repositories.mjs";
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
const REPO_API=BASE.replace(/\/$/,"")+"/rest/v1/repos";
const AUTH_HEADERS={apikey:KEY,Authorization:`Bearer ${KEY}`,"Accept-Profile":"repo_radar"};
const knownIds=new Set();
const qualityStats=new Map();
function skip(reason){qualityStats.set(reason,(qualityStats.get(reason)||0)+1);}
async function knownInDatabase(ids){
 const list=[...new Set(ids.filter(id=>Number.isSafeInteger(id)&&id>0))];
 const found=new Set();
 for(let offset=0;offset<list.length;offset+=100){
  const part=list.slice(offset,offset+100),url=new URL(REPO_API);
  url.searchParams.set("select","id");
  url.searchParams.set("id","in.("+part.join(",")+")");
  url.searchParams.set("limit","100");
  let done=false,lastError;
  for(let attempt=0;attempt<3;attempt++){
   try{
    const res=await fetch(url.href,{headers:AUTH_HEADERS,signal:AbortSignal.timeout(30000)});
    if(!res.ok){
     const message=(await res.text()).slice(0,400);
     lastError=new Error(`Supabase duplicate lookup ${res.status}: ${message}`);
     if(![408,429,500,502,503,504].includes(res.status))throw lastError;
    }else{
     const rows=await res.json();
     if(!Array.isArray(rows))throw Error("Unexpected Supabase lookup response");
     for(const row of rows)if(Number.isSafeInteger(row.id))found.add(row.id);
     done=true;break;
    }
   }catch(error){
    lastError=error;
    if(/^Supabase duplicate lookup 4(?!29)/.test(String(error.message)))throw error;
   }
   if(attempt<2)await sleep(900*(attempt+1));
  }
  if(!done)throw lastError||Error("Supabase duplicate lookup failed");
 }
 return found;
}
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
 is_fork:Boolean(repo.fork),is_archived:false,forks_count:repo.forks_count||0,
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
     Prefer:"resolution=ignore-duplicates,return=minimal"},
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
// Curated upstream projects + public accounts. Never mutate existing catalog
// rows: source metadata is checked against GitHub and IDs against Supabase.
async function syncFeaturedOriginals(){
 const entries=[];let missingCount=0,qualitySkipped=0;
 for(const item of featuredOriginals){
  let repo;
  try{repo=await getJson(`${API}/repos/${item.fullName}`);}
  catch(error){
   if(/GitHub search 404\b/.test(String(error.message))){
    missingCount++;console.warn(`Missing or private GitHub repo: ${item.fullName}`);
    continue;
   }
   throw error;
  }
  if(!repo?.id||repo.full_name?.toLowerCase()!==item.fullName.toLowerCase())throw Error(`Invalid seed metadata: ${item.fullName}`);
  let qualityRepo=repo;
  if(repo.size===0&&item.verifyFile){
   // GitHub can report an outdated size immediately after repository creation.
   // Check for a substantial real source file, not a README-only stub.
   try{
    const file=await getJson(`${API}/repos/${item.fullName}/contents/${item.verifyFile}`);
    if(file.type==="file"&&Number(file.size)>=1000)
     qualityRepo={...repo,size:Math.max(3,Math.ceil(file.size/1024))};
   }catch(error){console.warn(`Source verification failed for ${item.fullName}: ${error.message}`);}
  }
  const verdict=assessProject(qualityRepo,{featured:true});
  if(!verdict.eligible){qualitySkipped++;console.warn(`Seed excluded (${verdict.reason}): ${item.fullName}`);continue;}
  const entry=row(repo,item.category);
  entry.category=item.category;
  entry.homepage=item.homepage||entry.homepage;
  entry.description=repo.description||item.fallbackDescription;
  entries.push(entry);
 }
 const existing=await knownInDatabase(entries.map(x=>x.id));
 const fresh=entries.filter(x=>!existing.has(x.id));
 await upsert(fresh);
 for(const entry of entries)knownIds.add(entry.id);
 console.log(`Curated projects: ${fresh.length} new, ${existing.size} existing, ${missingCount} unavailable, ${qualitySkipped} excluded`);
}
async function syncTrackedOwners(){
 for(const owner of trackedOwners){
  const entries=[],observed=new Set();
  // GitHub Search exposes up to 1,000 matches in ten pages of 100.
  for(let page=1;page<=10;page++){
   const query=`user:${owner} fork:false archived:false`;
   const url=`${API}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100&page=${page}`;
   const response=await getJson(url),repos=response.items||[];
   if(!Array.isArray(repos))throw Error("Invalid owner discovery response");
   for(const repo of repos){
    if(!Number.isSafeInteger(repo?.id)||observed.has(repo.id)||knownIds.has(repo.id))continue;
    observed.add(repo.id);
    if(String(repo.owner?.login||"").toLowerCase()!==owner.toLowerCase())continue;
    const verdict=assessProject(repo);
    if(!verdict.eligible){skip("owner-"+verdict.reason);continue;}
    entries.push(row(repo,repo.language?"programming":"tools"));
   }
   if(repos.length<100)break;
  }
  const existing=await knownInDatabase(entries.map(x=>x.id));
  const fresh=entries.filter(x=>!existing.has(x.id));
  await upsert(fresh);
  for(const entry of entries)knownIds.add(entry.id);
  console.log(`Tracked @${owner}: ${fresh.length} new meaningful projects, ${existing.size} duplicates skipped`);
 }
}
const lane=process.env.COLLECTOR_LANE||"all";
if(!["all","topics","history"].includes(lane))throw Error("Unknown collector lane");
const searchDelay=lane==="all"?2400:5000;
if(lane!=="history"){
 await syncFeaturedOriginals();
 await syncTrackedOwners();
}
if(process.argv.includes("--featured-only")){
 console.log("Curated projects and public owned repositories synchronized.");
 process.exit(0);
}

const recent=discoverySlot();
const sort=recent%3===0?"updated":"stars";
const jobs=[
 ...(lane==="topics"?[]:buildBackfillPlan(recent)),
 ...(lane==="history"?[]:buildDiscoveryPlan([...QUERIES,...consoleDiscoveryQueries],recent)),
 ...(lane==="history"?[]:buildPopularForkPlan(recent)),
];
console.log(`Collector lane: ${lane}`);
const backfillExhausted=new Set();
console.log(`Discovery plan: ${jobs.length} searches, ${jobs.filter(x=>x.track==="rotating").length} rotating topics, ${jobs.filter(x=>x.track==="deep").length} deeper pages, sorting by ${sort}`);
let successful=0,failed=0,skippedInRun=0,skippedExisting=0,inserted=0;
for(const {category,search,page,track} of jobs){
 if(track==="backfill"&&backfillExhausted.has(search))continue;
 const q=`${search} is:public ${track==="popular-forks"?"fork:only":"fork:false"} archived:false stars:>=${track==="popular-forks"?50:track==="backfill"?1:2}`;
 const url=`${API}/search/repositories?q=${encodeURIComponent(q)}&sort=${track==="backfill"?"stars":sort}&order=desc&per_page=100&page=${page}`;
 let results;
 try{
  results=await getJson(url);
  successful++;
  if(track==="backfill"&&(results.items?.length??0)<100)backfillExhausted.add(search);
 }catch(error){
  failed++;console.error(`Search failed (${search} page ${page}): ${error.message}`);
  await sleep(searchDelay);continue;
 }
 const candidates=[];
 for(const repo of results.items||[]){
  if(!repo||!Number.isSafeInteger(repo.id)||repo.id<=0)continue;
  if(knownIds.has(repo.id)){skippedInRun++;continue;}
  const verdict=assessProject(repo);
  if(!verdict.eligible){skip(verdict.reason);continue;}
  const actualCategory=classify(repo,category);
  if(category==="console_webkit"&&actualCategory!=="console_webkit"){skip("wrong-category");continue;}
  candidates.push({repo,actualCategory});
 }
 // Query indexed Supabase primary keys before every insert. A failed duplicate
 // check must stop the job, never fall back to blindly inserting/updating.
 const existing=await knownInDatabase(candidates.map(x=>x.repo.id));
 const fresh=[];
 for(const {repo,actualCategory} of candidates){
  if(existing.has(repo.id)||knownIds.has(repo.id)){
   skippedExisting++;knownIds.add(repo.id);continue;
  }
  const item=row(repo,actualCategory);
  if(item.category==="console_webkit"){
   const direct=trustedGitHubPagesSite(repo.homepage);
   if(direct)item.homepage=direct;
   else if(repo.has_pages){
    try{
     const pages=await getJson(`${API}/repos/${repo.full_name}/pages`);
     item.homepage=trustedGitHubPagesSite(pages.html_url);
    }catch(error){console.warn(`GitHub Pages lookup: ${repo.full_name}: ${error.message}`);}
   }
  }
  fresh.push(item);
 }
 // If Supabase fails, stop instead of reporting an incomplete successful run.
 await upsert(fresh);
 for(const item of fresh)knownIds.add(item.id);
 inserted+=fresh.length;
 console.log(`[${track}] ${search} page ${page}: ${results.items?.length||0} matches, ${fresh.length} new, ${existing.size} already in database`);
 await sleep(searchDelay);
}
if(successful===0||successful<Math.ceil((successful+failed)*.7))
 throw new Error(`Discovery incomplete: ${successful}/${successful+failed} searches succeeded, ${failed} failed.`);
console.log(`Discovery complete: ${inserted} new repositories, ${skippedExisting} existing IDs, ${skippedInRun} repeats within run; ${successful}/${successful+failed} queries succeeded. Quality exclusions: ${JSON.stringify(Object.fromEntries(qualityStats))}. No existing data overwritten.`);
