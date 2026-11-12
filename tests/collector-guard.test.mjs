import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const collector=readFileSync(new URL("../scripts/collect.mjs",import.meta.url),"utf8");

test("duplicate detection queries Supabase IDs, does not rely on in-memory only",()=>{
 assert.ok(collector.includes('url.searchParams.set("id","in.("+part.join(",")+")");'));
 assert.match(collector,/const existing=await knownInDatabase\(candidates\.map\(x=>x\.repo\.id\)\)/);
 assert.match(collector,/if\(existing\.has\(repo\.id\)\|\|knownIds\.has\(repo\.id\)\)/);
});
test("the importer never overwrites existing records",()=>{
 assert.match(collector,/resolution=ignore-duplicates,return=minimal/);
 assert.doesNotMatch(collector,/resolution=merge-duplicates/);
 assert.match(collector,/if\(!done\)throw lastError/);
 assert.match(collector,/await upsert\(fresh\)/);
});
test("unwanted empty and copy projects are rejected before writes",()=>{
 assert.match(collector,/const verdict=assessProject\(repo\)/);
 assert.match(collector,/if\(!verdict\.eligible\)/);
 assert.match(collector,/if\(category==="console_webkit"&&actualCategory!=="console_webkit"\)/);
});
