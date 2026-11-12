import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");

test("attachment plus button shows a custom menu rather than opening an input immediately",()=>{
 assert.match(html, /id="attachment-toggle"[^>]*aria-haspopup="menu"/);
 assert.match(html, /id="attachment-menu"[^>]*role="menu"/);
 assert.match(html, /data-file-kind="photo"/);
 assert.match(html, /data-file-kind="video"/);
 assert.match(html, /data-file-kind="audio"/);
 assert.match(html, /data-file-kind="file"/);
 assert.doesNotMatch(html, /<label\s+for="file-input"/);
 assert.match(app, /\$\("attachment-toggle"\)\.onclick=/);
 assert.match(app, /input\.click\(\);/);
 assert.match(app, /function closeAttachmentMenu\(/);
});
test("attachment types are accepted only after an explicit selection",()=>{
 assert.match(app, /const ATTACHMENT_ACCEPT=\{/);
 assert.match(app, /input\.accept=ATTACHMENT_ACCEPT\[kind\]/);
 assert.match(app, /Object\.prototype\.hasOwnProperty\.call\(ATTACHMENT_ACCEPT,kind\)/);
 assert.match(app, /input\.removeAttribute\("capture"\)/);
 assert.match(app, /\$\("attachment-toggle"\)\.disabled=false/);
 assert.match(app, /\$\("attachment-toggle"\)\.disabled=true/);
});
test("attachment menu is keyboard accessible and responsive",()=>{
 assert.match(app, /event\.key==="Escape"/);
 assert.match(css, /\.attachment-menu \[role="menuitem"\]/);
 assert.match(css, /@keyframes attachmentMenuOpen/);
 assert.match(css, /prefers-reduced-motion:reduce/);
});
