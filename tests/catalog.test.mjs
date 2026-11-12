import test from "node:test";
import assert from "node:assert/strict";
import {isConsoleWebKit,trustedGitHubPagesSite} from "../lib/catalog.mjs";
test("Console WebKit requires explicit console and WebKit words",()=>{
 assert.equal(isConsoleWebKit({name:"ps4-webkit-host"}),true);
 assert.equal(isConsoleWebKit({name:"PS5 exploit",description:"WebKit for PlayStation 5"}),true);
 assert.equal(isConsoleWebKit({name:"webkit_weather_extension",description:"Browser toolbar"}),false);
 assert.equal(isConsoleWebKit({name:"PS4-emulator",description:"Console game emulator"}),false);
 assert.equal(isConsoleWebKit({name:"WebKit",description:"generic engine for browsers"}),false);
 assert.equal(isConsoleWebKit({name:"Wii U Browser",topics:["webkit","wiiu"]}),true);
 assert.equal(isConsoleWebKit({name:"Switch UI",description:"toggle webkit dark mode"}),false);
});
test("Only URLs from GitHub Pages metadata are linked",()=>{
 assert.equal(trustedGitHubPagesSite("https://example.github.io/ps4/"),"https://example.github.io/ps4/");
 assert.equal(trustedGitHubPagesSite("http://example.github.io/ps4/"),null);
 assert.equal(trustedGitHubPagesSite("https://example.github.io.evil.com/ps4/"),null);
 assert.equal(trustedGitHubPagesSite("https://github.com/example/repo"),null);
 assert.equal(trustedGitHubPagesSite("javascript:alert(1)"),null);
});
