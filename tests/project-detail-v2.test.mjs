import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");

test("project detail is a bilingual image-and-description panel without screenshots",()=>{
 assert.match(html,/id="repo-preview-image"/);
 assert.match(html,/id="repo-detail-description"/);
 assert.match(html,/id="repo-desc-tab-ru"/);
 assert.match(html,/id="repo-desc-tab-en"/);
 assert.match(html,/id="repo-description-ru"/);
 assert.match(html,/id="repo-description-en"/);
 assert.doesNotMatch(html,/id="repo-images"|id="repo-images-status"|class="repo-screenshots"/);
 assert.doesNotMatch(app,/readmeScreenshots|repo-images|screenshotsLoading/);
 assert.match(app,/PROJECT_FALLBACK_IMAGE="\.\/assets\/nobody-came\.png"/);
 assert.match(app,/function setProjectDescriptionLanguage/);
});
test("placeholder file preserves the original 447-pixel canvas",()=>{
 const png=readFileSync(new URL("../assets/nobody-came.png",import.meta.url));
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.readUInt32BE(16),447);
 assert.equal(png.readUInt32BE(20),447);
});
test("visible animations respect reduced motion and cosmic headline is pale green",()=>{
 assert.match(css,/@keyframes repoDialogOpen/);
 assert.match(css,/@keyframes repoCardEnter/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/body\[data-theme=cosmic\] \.hero h1/);
 assert.match(css,/#bdf3c7/);
});
test("README has separate expanded Russian and English documentation",()=>{
 assert.match(readme,/# Русский/);
 assert.match(readme,/# English/);
 assert.ok(readme.split("# Русский")[1].split("# English")[0].length>2500);
 assert.ok(readme.split("# English")[1].length>2500);
});
