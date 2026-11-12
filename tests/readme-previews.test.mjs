import test from "node:test";
import assert from "node:assert/strict";
import {readmeScreenshots} from "../lib/readme-previews.mjs";
const base="https://raw.githubusercontent.com/example/project/main/docs/README.md";
test("resolves relative screenshots and ignores badges",()=>{
 const md='![Build badge](https://img.shields.io/badge/green) ![Screenshot](../screenshots/screen.png) <img src="https://user-images.githubusercontent.com/23/preview.webp" alt="Demo"/>';
 const x=readmeScreenshots(md,base);
 assert.equal(x.length,2);
 assert.equal(x[0].src,"https://raw.githubusercontent.com/example/project/main/screenshots/screen.png");
 assert.ok(x[1].src.endsWith("preview.webp"));
});
test("rejects HTML/image XSS and external trackers",()=>{
 const md='![Unsafe](javascript:alert.png) ![Tracker](https://evil.example/screenshot.png) <img src="https://github.com.evil.example/a.png"> ![Okay](https://github.com/example/project/assets/1234/demo.jpg)';
 const x=readmeScreenshots(md,base);
 assert.equal(x.length,1);assert.ok(x[0].src.startsWith("https://github.com/"));
});
test("rejects untrusted README locations and large list overflows",()=>{
 assert.deepEqual(readmeScreenshots('![image](screenshot.png)','https://evil.example/README.md'),[]);
 assert.ok(readmeScreenshots(Array(20).fill('![Shot](../screenshots/preview.png)').join(" "),base).length<=6);
});
