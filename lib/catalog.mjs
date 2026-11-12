// Shared category rules and GitHub Pages URL validation.
const webkit=/(^|[^a-z0-9])web[ ._-]?kit(?=$|[^a-z0-9])/i;
const consoleName=/(^|[^a-z0-9])(?:ps3|ps4|ps5|playstation|ps[ ._-]?vita|wii[ ._-]?u|xbox|nintendo[ ._-]?switch)(?=$|[^a-z0-9])/i;
export function isConsoleWebKit(repo){
 const text=[repo?.name,repo?.description,...(Array.isArray(repo?.topics)?repo.topics:[])].filter(Boolean).join(" ");
 return webkit.test(text)&&consoleName.test(text);
}
export function trustedGitHubPagesSite(value){
 if(typeof value!=="string"||!value.trim())return null;
 try{
  const url=new URL(value.trim());
  if(url.protocol!=="https:"||url.username||url.password||url.port)return null;
  if(!/^[a-z0-9-]+\.github\.io$/i.test(url.hostname))return null;
  return url.href;
 }catch{return null;}
}
