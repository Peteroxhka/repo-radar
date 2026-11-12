// Extract a small, safe gallery of images explicitly referenced by a GitHub README.
// Do not render README HTML or trust external image hosts.
function isGithubImageHost(url){
 const h=url.hostname.toLowerCase();
 return h==="raw.githubusercontent.com"||h==="user-images.githubusercontent.com"||
        h==="github.com"||h.endsWith(".githubusercontent.com");
}
export function readmeScreenshots(markdown, readmeUrl, limit=6){
 if(typeof markdown!=="string"||typeof readmeUrl!=="string")return [];
 let base;
 try{base=new URL(".",readmeUrl);if(base.protocol!=="https:"||base.hostname!=="raw.githubusercontent.com")return [];}
 catch{return [];}
 const images=[];
 const capture=(alt,link)=>{
  if(!link||images.length>=100)return;
  const raw=link.trim().replace(/^<|>$/g,"").replace(/[\r\n]/g,"");
  if(raw.length>1000||!raw)return;
  let url;try{url=new URL(raw,base);}catch{return;}
  if(url.protocol!=="https:"||!isGithubImageHost(url)||url.username||url.password)return;
  if(!/\.(?:png|jpe?g|gif|webp|avif|svg)(?:$|[?#])/i.test(url.pathname+url.search)&&!url.pathname.includes("/assets/"))return;
  if(images.some(im=>im.src===url.href))return;
  const label=String(alt||"").slice(0,120).trim()||"Project image";
  const isScreenshot=/(?:screen[ -]?shot|screen[ -]?capture|preview|demonstration|interface|screenshot|demo|showcase|gallery)/i.test(label+" "+url.pathname);
  const isBadge=/(?:badge|shields\.io|travis|actions\/workflows|logo|avatar|icon|button)/i.test(label+" "+url.pathname);
  if(!isBadge)images.push({src:url.href,alt:label,priority:isScreenshot?0:1});
 };
 // Standard Markdown image references and quoted HTML image tags.
 for(const m of markdown.slice(0,150000).matchAll(/!\[([^\]]*)\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g))capture(m[1],m[2]);
 for(const m of markdown.slice(0,150000).matchAll(/<img\b[^>]*?src\s*=\s*["']([^"']+)["'][^>]*>/gi)){
  const alt=m[0].match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1]||"Project image";
  capture(alt,m[1]);
 }
 return images.sort((a,b)=>a.priority-b.priority).slice(0,Math.min(Math.max(limit,0),8)).map(({src,alt})=>({src,alt}));
}
