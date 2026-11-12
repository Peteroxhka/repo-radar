import test from "node:test";
import assert from "node:assert/strict";
import {buildDiscoveryPlan,discoverySlot,ROTATING_DISCOVERY} from "../lib/discovery-plan.mjs";
const BASE=[
 ["tools","topic:developer-tools"],["ai","topic:llm"],
 ["data","topic:database"],["web","topic:frontend"],
 ["games","topic:gamedev"]
];
test("hourly discovery expands beyond the first page and never repeats a query/page",()=>{
 const jobs=buildDiscoveryPlan(BASE,500000);
 assert.ok(jobs.length>=19);
 assert.ok(jobs.some(x=>x.page>1));
 assert.ok(jobs.some(x=>x.track==="rotating"));
 assert.equal(new Set(jobs.map(x=>x.search+"|"+x.page)).size,jobs.length);
 assert.ok(jobs.every(x=>x.page<=10));
});
test("rotations cover more topic families rather than re-importing the same names",()=>{
 const every=Array.from({length:6},(_,i)=>buildDiscoveryPlan(BASE,500000+i));
 const rotated=every.flatMap(x=>x.filter(q=>q.track==="rotating").map(q=>q.search));
 assert.ok(new Set(rotated).size>=50);
 assert.ok(rotated.includes("topic:rag"));
 assert.ok(rotated.includes("topic:sqlite"));
 assert.ok(rotated.includes("topic:godot"));
 const total=ROTATING_DISCOVERY.filter(([,q])=>!/^webkit ps[45] /.test(q)).length;
 assert.equal(new Set(rotated).size,total);
});
test("deep pagination shifts across 4-hour batches without skipping page 1 base searches",()=>{
 const first=buildDiscoveryPlan(BASE,500000);
 const fifth=buildDiscoveryPlan(BASE,500004);
 assert.ok(first.some(x=>x.page>1));
 assert.ok(fifth.some(x=>x.page>1));
 assert.notEqual(first.find(x=>x.track==="deep")?.page,fifth.find(x=>x.track==="deep")?.page);
 assert.ok(first.filter(x=>x.track==="base").every(x=>x.page===1));
 assert.ok(discoverySlot("2026-11-13T00:00:00.000Z")>0);
});
test("invalid inputs do not create dangerous GitHub searches",()=>{
 assert.throws(()=>buildDiscoveryPlan([["bad","topic:any"]],500000));
 assert.throws(()=>buildDiscoveryPlan([["tools",""]],500000));
 assert.throws(()=>buildDiscoveryPlan(BASE,2.5));
});
