import test from "node:test";
import assert from "node:assert/strict";
import {curatedDescription} from "../lib/curated-descriptions.mjs";
import {attachmentKind,safeAttachmentName,prettyBytes,isPrivateStorageUrl} from "../lib/attachment-ui.mjs";
test("freeCodeCamp has a real full-length Russian description instead of untranslated English",()=>{
 const d=curatedDescription("freeCodeCamp/freeCodeCamp");
 assert.ok(d?.ru.includes("бесплатная образовательная платформа"));
 assert.ok(d.ru.length>240);
 assert.ok(d.en.includes("open-source learning platform"));
 assert.equal(curatedDescription("unknown/repo"),null);
});
test("attachment viewer classifies images, video, audio, pdfs and docs",()=>{
 assert.equal(attachmentKind("pic.webp","image/webp"),"image");
 assert.equal(attachmentKind("clip.mp4","video/mp4"),"video");
 assert.equal(attachmentKind("track.mp3","audio/mpeg"),"audio");
 assert.equal(attachmentKind("book.pdf","application/pdf"),"pdf");
 assert.equal(attachmentKind("table.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),"document");
 assert.equal(attachmentKind("fake.png","text/html"),"document");
 assert.equal(safeAttachmentName("a/\u0000b.mp3"),"ab.mp3");
 assert.equal(prettyBytes(1048576),"1.0 MB");
});
test("private Storage viewer URLs are restricted to this Supabase instance",()=>{
 const host="https://project-ref.supabase.co";
 assert.ok(isPrivateStorageUrl(host+"/storage/v1/object/sign/repo-radar-dm/x?token=abc",host));
 assert.equal(isPrivateStorageUrl("https://evil.example/storage/v1/object/sign/repo-radar-dm/x?token=abc",host),false);
 assert.equal(isPrivateStorageUrl(host+"/storage/v1/object/public/repo-radar-dm/x",host),false);
});
