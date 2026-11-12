import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../lib/console-detect.js",import.meta.url),"utf8");
const ctx={};vm.runInNewContext(source,ctx);
const detector=ctx.RepoRadarConsoleDetect;
test("PS4 old and recent user agents are recognized without inspecting private data",()=>{
 assert.equal(detector.detect("Mozilla/5.0 (PlayStation; PlayStation 4/9.00) AppleWebKit/605.1").firmware,"9.00");
 assert.equal(detector.detect("Mozilla/5.0 (PlayStation 4 7.55) AppleWebKit/601.2").firmware,"7.55");
 assert.equal(detector.detect("Mozilla/5.0 (PlayStation 4) AppleWebKit/531.3").firmware,"");
});
test("PS5 firmware is parsed from the console tag, not Safari version",()=>{
 const r=detector.detect("Mozilla/5.0 (PlayStation; PlayStation 5/10.20) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15");
 assert.equal(r.model,"PS5");assert.equal(r.firmware,"10.20");
});
test("other consoles and unknown browsers never get invented firmware",()=>{
 const inputs=[["Nintendo WiiU AppleWebKit/536.30","Wii U"],["Mozilla Nintendo Switch Browser","Nintendo Switch"],
 ["Mozilla/5.0 (PLAYSTATION 3; 4.82)","PS3"],["Mozilla Xbox One Edge/18.0","Xbox"],
 ["Mozilla PS Vita 3.74","PS Vita"],["Mozilla/5.0 Windows 11 Chrome",""]];
 for(const [ua,model] of inputs){const result=detector.detect(ua);assert.equal(result.model,model);assert.equal(result.firmware,"");}
});
test("manual firmware is strictly validated",()=>{
 assert.equal(detector.firmwareCheck("14.02"),"14.02");
 assert.equal(detector.firmwareCheck("2.50"),"2.50");
 assert.equal(detector.firmwareCheck("14.XX"),"");
 assert.equal(detector.firmwareCheck("<script>"),"");
 assert.equal(detector.firmwareCheck(""),"");
});
