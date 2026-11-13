import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {featuredOriginals,trackedOwners,consoleDiscoveryQueries} from "../lib/featured-repositories.mjs";
test("submitted and owner projects are uniquely identified by full GitHub names",()=>{
 assert.equal(featuredOriginals.length,22);
 const names=featuredOriginals.map(x=>x.fullName.toLowerCase());
 assert.equal(new Set(names).size,names.length);
 assert.ok(names.includes("peteroxhka/consolewebkit"));
 assert.ok(names.includes("peteroxhka/repo-radar"));
 assert.ok(names.includes("dnestruev/messenger"));
 assert.ok(names.includes("atmosphere-nx/atmosphere"));
 assert.ok(names.includes("mangoscango/ps5-account-tools"));
 assert.ok(!names.includes("swordpdf/prosperoeden"));
 assert.ok(!names.includes("blackbearreloaded/prosperoeden"));
 assert.ok(featuredOriginals.every(x=>/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x.fullName)));
});
test("all curated entries have a reviewed category and nonempty fallback description",()=>{
 const allowed=new Set(["programming","tools","ai","data","web","learning","games","console_webkit","other"]);
 for(const project of featuredOriginals){
  assert.ok(allowed.has(project.category),project.fullName);
  assert.ok(project.fallbackDescription?.length>=20,project.fullName);
 }
 const website=featuredOriginals.find(x=>x.fullName==="Peteroxhka/ConsoleWebKit");
 assert.equal(website.verifyFile,"index.html");
});
test("owner discovery is limited to explicitly tracked profiles",()=>{
 assert.deepEqual(trackedOwners,["Peteroxhka","dnestruev"]);
 assert.ok(consoleDiscoveryQueries.every(([cat,q])=>q.length>10&&cat));
});
test("collector does not overwrite or accept missing and empty reviewed projects",()=>{
 const code=readFileSync(new URL("../scripts/collect.mjs",import.meta.url),"utf8");
 assert.match(code,/assessProject\(qualityRepo,\{featured:true\}\)/);
 assert.match(code,/repo\.size===0&&item\.verifyFile/);
 assert.match(code,/const existing=await knownInDatabase\(entries\.map\(x=>x\.id\)\)/);
 assert.match(code,/Prefer:"resolution=ignore-duplicates,return=minimal"/);
 assert.match(code,/if\(process\.argv\.includes\("--featured-only"\)\)/);
 assert.match(code,/async function syncTrackedOwners\(/);
 assert.match(code,/buildDiscoveryPlan\(\[\.\.\.QUERIES,\.\.\.consoleDiscoveryQueries\],recent\)/);
});
