import test from "node:test";
import assert from "node:assert/strict";
import {consoleMetadata,filterConsoleProjects,sortConsoleProjects,consoleFacetOptions} from "../lib/console-filters.mjs";

const projects=[
 {id:1,name:"PS4-6.20-WebKit",description:"WebKit proof of concept for PS4",stars:210,language:"JavaScript",category:"console_webkit"},
 {id:2,name:"PS5 Kit v2.1",description:"WebKit host for PS5 firmwares 9.00-12.00, retail and devkit",stars:18,language:"HTML",category:"console_webkit"},
 {id:3,name:"PS Vita tool",description:"WebKit HEN for PS Vita firmware 3.65",stars:55,language:"JavaScript",category:"console_webkit"},
 {id:4,name:"PS4 generic",description:"WebKit for PS4, firmware not specified",stars:0,category:"console_webkit"}
];
test("extracts explicitly labelled firmware and console metadata",()=>{
 assert.deepEqual(consoleMetadata(projects[0]).consoles,["PS4"]);
 assert.deepEqual(consoleMetadata(projects[0]).firmwareVersions,["6.20"]);
 assert.equal(consoleMetadata(projects[1]).projectVersion,"v2.1");
 assert.ok(consoleMetadata(projects[1]).firmwareVersions.includes("9.00–12.00"));
 assert.deepEqual(consoleMetadata(projects[1]).firmwareTypes,["Retail","Devkit"]);
 assert.deepEqual(consoleMetadata(projects[2]).firmwareVersions,["3.65"]);
 assert.deepEqual(consoleMetadata(projects[3]).firmwareVersions,[]);
});
test("filters console independently from firmware and release versions",()=>{
 assert.deepEqual(filterConsoleProjects(projects,{console:"PS4",firmwareVersion:"6.20"}).map(x=>x.id),[1]);
 assert.deepEqual(filterConsoleProjects(projects,{console:"PS5",version:"v2.1",firmwareType:"Devkit"}).map(x=>x.id),[2]);
 assert.deepEqual(filterConsoleProjects(projects,{console:"PS4",firmwareVersion:"__unknown__"}).map(x=>x.id),[4]);
 assert.deepEqual(filterConsoleProjects(projects,{search:"kit",includeDescription:false}).map(x=>x.id),[1,2]);
 assert.deepEqual(filterConsoleProjects(projects,{search:"webkit",includeDescription:true,console:"PS5"}).map(x=>x.id),[2]);
});
test("sorts by actual stars before anything else",()=>{
 assert.deepEqual(sortConsoleProjects(projects,"popular").map(x=>x.id),[1,3,2,4]);
 assert.deepEqual(sortConsoleProjects(projects,"least").map(x=>x.id),[4,2,3,1]);
});
test("firmware options are scoped to chosen console",()=>{
 const a=consoleFacetOptions(projects,"PS4"),b=consoleFacetOptions(projects,"PS5");
 assert.ok(a.firmwareVersions.includes("6.20"));
 assert.ok(!a.firmwareVersions.includes("9.00–12.00"));
 assert.ok(b.firmwareVersions.includes("9.00–12.00"));
});
