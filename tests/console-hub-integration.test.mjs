import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const home=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const hub=readFileSync(new URL("../console-hub.html",import.meta.url),"utf8");
const hubScript=readFileSync(new URL("../console-hub.js",import.meta.url),"utf8");
const stamp=readFileSync(new URL("../scripts/stamp-build.mjs",import.meta.url),"utf8");
test("main page links to the multi-console hub without executing exploits",()=>{
 assert.ok(home.includes('href="./console-hub.html"'));
 assert.ok(home.includes('data-i18n="consoleHubCta"'));
 assert.ok(hub.includes('data-console="PS4"'));
 assert.ok(hub.includes('data-console="PS5"'));
 for(const x of ["PS3","PS Vita","Nintendo Switch","Wii U","Xbox"])
  assert.ok(hub.includes('data-console="'+x+'"'),x);
 assert.match(hub,/No exploits are executed/);
});
test("detector loads before the hub UI without modern-module requirements",()=>{
 const det=hub.indexOf('src="./lib/console-detect.js"');
 const ui=hub.indexOf('src="./console-hub.js"');
 assert.ok(det>0&&ui>det);
 assert.doesNotMatch(hub,/<script[^>]*type="module"/);
 assert.ok(hubScript.includes("navigator.userAgent"));
 assert.ok(hubScript.includes("aria-pressed"));
});
test("model selection is safely passed to the main catalog",()=>{
 assert.ok(app.includes('new URL(location.href).searchParams.get("console")'));
 assert.ok(app.includes('state.category="console_webkit"'));
 assert.ok(app.includes('state.consoleFilters.console=fromHub'));
 assert.ok(hubScript.includes('encodeURIComponent(selected)'));
 assert.ok(hubScript.includes('href="./?console="'));
});
test("new standalone assets are version stamped during Pages deployment",()=>{
 assert.ok(stamp.includes('readFileSync("console-hub.html"'));
 assert.ok(stamp.includes('writeFileSync("console-hub.html",hub)'));
 assert.ok(stamp.includes('console-detect.js?v='));
});
