// Conservative ingestion quality gate. Do not confuse low star counts with
// lack of project value: an original with useful code and a clear description
// should be eligible even when it has no GitHub stars.
const emptyDescription=/^(?:test|testing|test repo(?:sitory)?|just (?:a )?test|hello[ -]?world|my first (?:repo|repository|project)|temporary|temp repo|empty(?: repo(?:sitory)?)?|initial commit|created with github|no description|description|todo|lorem ipsum|sample(?: project| repo)?|demo(?: project| repo)?)[.!\s-]*$/i;
const safePath=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
export function assessProject(repo,{featured=false}={}){
 if(!repo||!Number.isSafeInteger(repo.id)||repo.id<=0||!safePath.test(String(repo.full_name||""))||
  !repo.name||!repo.html_url)return {eligible:false,reason:"invalid"};
 if(repo.private||repo.fork||repo.archived||repo.disabled)return {eligible:false,reason:"unavailable"};
 // GitHub repository.size is the public API's size-in-KB metadata. A zero-byte
 // repository is empty even if it has a description or stars.
 if(repo.size===0||repo.empty===true)return {eligible:false,reason:"empty"};
 if(featured)return {eligible:true,reason:"featured"};
 const description=String(repo.description||"").trim().replace(/\s+/g," ");
 const topics=Array.isArray(repo.topics)?repo.topics.filter(x=>typeof x==="string"&&x.trim()):[];
 const stars=Number(repo.stargazers_count)||0;
 if(emptyDescription.test(description))return {eligible:false,reason:"placeholder"};
 if(description.length<16&&!(stars>=50&&topics.length>=2))
  return {eligible:false,reason:"sparse"};
 if(repo.size!==undefined&&repo.size!==null&&Number(repo.size)<3&&stars<5)
  return {eligible:false,reason:"tiny"};
 return {eligible:true,reason:"content"};
}
export function selectNewProjects(repos,knownIds=new Set()){
 const fresh=[];
 for(const repo of repos){
  if(knownIds.has(repo.id))continue;
  if(!assessProject(repo).eligible)continue;
  fresh.push(repo);
 }
 return fresh;
}
