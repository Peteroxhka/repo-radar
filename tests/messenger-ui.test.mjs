import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
test("redesigned chat keeps all DOM IDs unique and accessible to JS",()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const unique=new Set(ids);
 assert.equal(unique.size,ids.length);
 const referenced=[...js.matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]);
 for(const id of referenced)assert.ok(unique.has(id),`missing #${id}`);
 for(const id of ["chat-encryption-toggle","chat-encryption-panel","chat-secret","chat-secret-enable",
 "chat-secret-clear","chat-security-label","chat-messages","chat-back","chat-peer-avatar","file-preview"])
  assert.ok(unique.has(id),id);
});
test("new messages use native media cards instead of filename-only attachments",()=>{
 assert.match(js,/function attachmentCard\(/);
 assert.match(js,/document\.createElement\("video"\)/);
 assert.match(js,/document\.createElement\("audio"\)/);
 assert.match(js,/document\.createElement\("img"\)/);
 assert.match(js,/createSignedUrl\(message\.file_path,1800\)/);
 assert.match(js,/decryptFile\(await res\.blob\(\),session,message\.file_type\)/);
 assert.match(js,/safeAttachmentName\(message\.file_name\)/);
 assert.doesNotMatch(js,/a\.textContent="📎 "\+\(m\.file_name/);
});
test("encrypted uploads are clearly separated from unencrypted legacy messages",()=>{
 assert.match(js,/const secureSession=chatCryptoSession/);
 assert.match(js,/storedMessage=await encryptMessage\(message,secureSession\)/);
 assert.match(js,/upload=await encryptFile\(file,secureSession\)/);
 assert.match(js,/file_path=user\.id\+"\/"\+peer\.id\+"\/enc-"/);
 assert.match(js,/const enc=isEncryptedAttachment\(message\.file_path\)/);
 assert.match(js,/chatCryptoSession=null/);
});
test("mobile chat and animations include reduced-motion fallback",()=>{
 assert.match(css,/\.chat-modern\.has-peer \.chat-sidebar\{display:none\}/);
 assert.match(css,/\.chat-modern\.has-peer \.chat-panel\{display:flex\}/);
 assert.match(css,/@keyframes chatBubbleIn/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
