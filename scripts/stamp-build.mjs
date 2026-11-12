// Stamp the static GitHub Pages artifact so updates cannot silently reuse stale
// CSS / ES module URLs in browsers and CDNs. This runs only on Actions output.
import {readFileSync,writeFileSync} from "node:fs";
const build=(process.env.GITHUB_SHA||"dev").slice(0,12);
if(!/^[a-f0-9]{7,12}$|^dev$/.test(build))throw new Error("Invalid build revision");
const html=readFileSync("index.html","utf8")
 .replaceAll("__BUILD_SHA__",build)
 .replace(/((?:src|href)="\.\/(?:app\.js|styles\.css|unsupported-browser\.js))"/g,`$1?v=${build}"`);
if(!html.includes(`app.js?v=${build}`)||!html.includes(`styles.css?v=${build}`))
 throw new Error("Missing versioned static assets in index.html");
writeFileSync("index.html",html);
const js=readFileSync("app.js","utf8")
 .replace(/(from "\.\/(?:config\.js|lib\/[a-z-]+\.mjs))";/g,`$1?v=${build}";`);
writeFileSync("app.js",js);
// Keep the separate ES5 console page cache coherent with its static assets.
const hub=readFileSync("console-hub.html","utf8")
 .replaceAll("__BUILD_SHA__",build)
 .replace(/((?:src|href)="\.\/(?:console-hub\.js|console-hub\.css|lib\/console-detect\.js))"/g,`$1?v=${build}"`);
if(!hub.includes(`console-hub.js?v=${build}`)||!hub.includes(`console-hub.css?v=${build}`)||!hub.includes(`console-detect.js?v=${build}`))
 throw new Error("Console Hub assets were not versioned");
writeFileSync("console-hub.html",hub);
console.log("Prepared GitHub Pages build",build);
