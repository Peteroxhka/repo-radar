import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {officialText,supportedOfficialLocales} from "../lib/official-info.mjs";

test("Repo Radar official description is translated in every supported UI language",()=>{
 const supported=["en","ru","es","fr","de","pt","zh","ja","ko","ar","hi","tr"];
 assert.deepEqual(supportedOfficialLocales.sort(),supported.sort());
 for(const code of supported){
  for(const key of ["featuredRepoEyebrow","featuredRepoTitle","repoRadarDescription","featuredRepoGithub","featuredRepoWebsite"]){
   assert.ok(officialText(code,key)?.trim().length>=2,`${code}/${key}`);
  }
 }
 assert.equal(officialText("en","unknown"),null);
});
test("new global searches reset stale category and language filters",()=>{
 const source=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(source.includes('state.category="all";state.language=""'));
 assert.ok(ui.includes('class="official-feature"'));
 assert.ok(ui.includes('data-i18n="repoRadarDescription"'));
 assert.ok(ui.includes('id="admin-supabase-connect"'));
 assert.ok(source.includes('github.className="admin-repo-github"'));
});
