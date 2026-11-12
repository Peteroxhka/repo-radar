import test from "node:test";
import assert from "node:assert/strict";
import {assessProject,selectNewProjects} from "../lib/repo-quality.mjs";
const repo=(overrides={})=>({
 id:123,name:"hello-useful",full_name:"person/hello-useful",
 html_url:"https://github.com/person/hello-useful",size:140,stargazers_count:0,
 description:"A small original tool with a clear purpose and usable source code.",
 topics:["tooling"],fork:false,archived:false,private:false,disabled:false,
 ...overrides
});
test("original useful code is accepted even with zero stars",()=>{
 assert.equal(assessProject(repo()).eligible,true);
});
test("forks, archived, disabled, private and empty projects are not imported",()=>{
 for(const flag of ["fork","archived","disabled","private","empty"])
  assert.equal(assessProject(repo({[flag]:true})).eligible,false,flag);
 assert.deepEqual(assessProject(repo({size:0})),{eligible:false,reason:"empty"});
});
test("empty and placeholder descriptions are rejected",()=>{
 for(const desc of [""," ","test","my first repo","hello world","initial commit","TODO","no description","demo project"])
  assert.equal(assessProject(repo({description:desc})).eligible,false,desc);
 assert.equal(assessProject(repo({description:"short",stars:0})).eligible,false);
});
test("valuable, established project without description can be accepted with context",()=>{
 assert.equal(assessProject(repo({description:"",stargazers_count:600,topics:["language","compiler"],size:1800})).eligible,true);
 assert.equal(assessProject(repo({description:"",stargazers_count:600,topics:[],size:1800})).eligible,false);
});
test("tiny throwaway projects are skipped, small real utility stays",()=>{
 assert.equal(assessProject(repo({size:1,description:"A tiny example used for a quick JavaScript demonstration only.",stargazers_count:0})).eligible,false);
 assert.equal(assessProject(repo({size:8,description:"A tiny helpful utility for learning mathematics.",stargazers_count:0})).eligible,true);
});
test("records already present by GitHub ID are not included in a new batch",()=>{
 const data=[repo(),repo({id:456,full_name:"other/second",name:"second"}),repo({id:789,full_name:"other/test",description:"test"})];
 assert.deepEqual(selectNewProjects(data,new Set([123])).map(x=>x.id),[456]);
});
test("invalid repository metadata cannot reach storage",()=>{
 assert.equal(assessProject(repo({id:-1})).eligible,false);
 assert.equal(assessProject(repo({full_name:"bad/owner/name"})).eligible,false);
});
