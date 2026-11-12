// Console WebKit catalog facets. Read only explicit project metadata;
// unknown firmware compatibility is never inferred from a version range.
const PLATFORMS=[
 ["PS3",/(?:\bps3\b|\bplaystation\s*3\b)/i],
 ["PS4",/(?:\bps4\b|\bplaystation\s*4\b)/i],
 ["PS5",/(?:\bps5\b|\bplaystation\s*5\b)/i],
 ["PS Vita",/(?:\bps[ -]?vita\b|\bplaystation\s*vita\b|\bpsvita\b)/i],
 ["Wii U",/\bwii[ -]?u\b/i],
 ["Nintendo Switch",/\bnintendo[ -]?switch\b/i],
 ["Xbox",/\bxbox\b/i]
];
const TYPES=[
 ["CFW",/\b(?:cfw|custom[ -]?firmware)\b/i],
 ["HFW",/\b(?:hfw|hybrid[ -]?firmware)\b/i],
 ["OFW",/\b(?:ofw|official[ -]?firmware)\b/i],
 ["HEN",/\b(?:hen|goldhen|homebrew[ -]?enabler)\b/i],
 ["Retail",/\bretail\b/i],
 ["Devkit",/\bdev[ -]?kit\b/i],
 ["Testkit",/\btest[ -]?kit\b/i]
];
function unique(values){return [...new Set(values.filter(Boolean))];}
// Broad PS4 firmware families through 14.XX are filters, not a claim of
// support for a particular project or proof of console compatibility.
export const PS4_FIRMWARE_SERIES=Array.from({length:14},(_,i)=>`${i+1}.XX`);
const byName=(a,b)=>a.localeCompare(b,"en",{sensitivity:"base",numeric:true});
export function consoleMetadata(repo){
 const text=[repo?.name,repo?.description,...(Array.isArray(repo?.topics)?repo.topics:[])].filter(Boolean).join(" ").slice(0,2400);
 const consoles=PLATFORMS.filter(([,re])=>re.test(text)).map(([label])=>label);
 if(/playstation\s*4\s*\/\s*5/i.test(text)){
  for(const c of ["PS4","PS5"])if(!consoles.includes(c))consoles.push(c);
 }
 const types=TYPES.filter(([,re])=>re.test(text)).map(([label])=>label);
 // Explicit project release versions only, not firmware numbers or CVE IDs.
 let projectVersion=null;
 const projectMatch=String(repo?.name||"").match(/(?:^|[-_\s])v(\d+(?:\.\d+){0,2})(?![\d.])/i)
  || text.match(/\b(?:app|project|release)\s+version\s*[:=]?\s*v?(\d+(?:\.\d+){0,2})(?![\d.])/i);
 if(projectMatch)projectVersion="v"+projectMatch[1];
 const fw=[];
 // Context like: "PS4 9.00", "PS5 (4.03)", "PS4-6.XX-WebKit".
 const platformVersion=/(?:\b(?:PS[345]|PlayStation\s*[345]|PS[ -]?Vita)\b)[\s:()\/-]{1,12}(\d{1,2}\.\d{1,2}|\d{1,2}\.XX)(?:\s*(?:-|–|to)\s*(\d{1,2}\.\d{1,2}|\d{1,2}\.XX))?/gi;
 for(const m of text.matchAll(platformVersion))fw.push(m[2]?`${m[1]}–${m[2]}`:m[1]);
 // Explicit firmware contexts including version ranges; no guessing intermediate versions.
 const contextVersion=/\b(?:firmware(?:s)?|fw)\s*(?:versions?\s*)?(?:[:=]|v)?\s*(\d{1,2}\.\d{1,2}|\d{1,2}\.XX)(?:\s*(?:-|–|to)\s*(\d{1,2}\.\d{1,2}|\d{1,2}\.XX))?/gi;
 for(const m of text.matchAll(contextVersion))fw.push(m[2]?`${m[1]}–${m[2]}`:m[1]);
 return {consoles,projectVersion,firmwareVersions:unique(fw),firmwareTypes:types};
}
function matchesFirmware(values,selection){
 if(!selection)return true;
 if(selection==="__unknown__")return values.length===0;
 if(/^(?:[1-9]|1[0-4])\.XX$/.test(selection)){
  const family=selection.split(".")[0];
  // Exact reported version or an explicitly stated range boundary only.
  return values.some(v=>v.split(/[–-]/).some(p=>p.trim().match(/^(\d{1,2})\./)?.[1]===family));
 }
 return values.includes(selection);
}
function matchesFacet(values,selection){
 if(!selection)return true;
 if(selection==="__unknown__")return !values.length;
 return values.includes(selection);
}
export function filterConsoleProjects(rows,filters={}){
 const search=String(filters.search||"").trim().toLocaleLowerCase();
 const compact=search.replace(/[\s_.-]+/g,"");
 return rows.filter(r=>{
  if(filters.language&&r.language!==filters.language)return false;
  const meta=consoleMetadata(r);
  if(!matchesFacet(meta.consoles,filters.console))return false;
  if(!matchesFacet(meta.projectVersion?[meta.projectVersion]:[],filters.version))return false;
  if(!matchesFirmware(meta.firmwareVersions,filters.firmwareVersion))return false;
  if(!matchesFacet(meta.firmwareTypes,filters.firmwareType))return false;
  if(!search)return true;
  const name=String(r.name||"").toLocaleLowerCase();
  if(name.includes(search)||(compact&&name.replace(/[\s_.-]+/g,"").includes(compact)))return true;
  if(!filters.includeDescription)return false;
  return [r.description,...(Array.isArray(r.topics)?r.topics:[])].some(item=>String(item||"").toLocaleLowerCase().includes(search));
 });
}
export function sortConsoleProjects(rows,sort="popular"){
 const list=[...rows];
 const num=(x)=>Number(x)||0;
 const ts=(x)=>x?Date.parse(x)||0:0;
 list.sort((a,b)=>{
  let diff=0;
  if(sort==="least")diff=num(a.stars)-num(b.stars);
  else if(sort==="recent")diff=ts(b.pushed_at)-ts(a.pushed_at);
  else if(sort==="newest")diff=ts(b.created_at)-ts(a.created_at);
  else if(sort==="forked")diff=num(b.forks_count)-num(a.forks_count);
  else diff=num(b.stars)-num(a.stars);
  return diff||num(b.id)-num(a.id);
 });
 return list;
}
export function consoleFacetOptions(rows,selectedConsole=""){
 const subset=rows.filter(r=>!selectedConsole||consoleMetadata(r).consoles.includes(selectedConsole));
 const metas=subset.map(consoleMetadata);
 return {
  consoles:unique(rows.flatMap(r=>consoleMetadata(r).consoles)).sort(byName),
  versions:unique(metas.map(m=>m.projectVersion)).sort(byName),
  firmwareVersions:unique([...metas.flatMap(m=>m.firmwareVersions),...(selectedConsole==="PS4"?PS4_FIRMWARE_SERIES:[])]).sort(byName),
  firmwareTypes:unique(metas.flatMap(m=>m.firmwareTypes)).sort(byName)
 };
}
