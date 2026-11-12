import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSearch, mergeMessages, isCurrentChat, dmConversationFilter, attachmentMime} from '../lib/core.mjs';
test('repository queries preserve Latin, Cyrillic and technical names',()=>{
 for(const q of ['react','python','minecraft','нейросеть','owner/repo','C++','C#','русский текст','日本語']) assert.equal(normalizeSearch(q),q);
 assert.equal(normalizeSearch('  React   Native  '),'React Native');
 assert.equal(normalizeSearch('react),id.gt.0%*'),'react id.gt.0');
 assert.equal(normalizeSearch('a'.repeat(100)).length,80);
});
test('history is retained and overlapping realtime pages are deduplicated',()=>{
 const old=Array.from({length:150},(_,i)=>({id:String(i).padStart(4,'0'),created_at:'2026-11-12T12:00:00Z'}));
 const result=mergeMessages(old,old.slice(100).concat({id:'0150',created_at:'2026-11-12T12:00:00Z'}));
 assert.equal(result.length,151);assert.equal(result[0].id,'0000');assert.equal(result.at(-1).id,'0150');
});
test('stale work is rejected after switching chats or accounts, including A-B-A',()=>{
 const s={chatEpoch:3,user:{id:'u'},peer:{id:'a'}};
 assert.equal(isCurrentChat(s,3,'u','a'),true);
 assert.equal(isCurrentChat(s,1,'u','a'),false);
 assert.equal(isCurrentChat(s,3,'other','a'),false);
 assert.equal(isCurrentChat(s,3,'u','b'),false);
});

test('DM pagination always binds both participants to its cursor',()=>{
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  const cursor={id:'33333333-3333-4333-8333-333333333333',created_at:'2026-11-12T12:00:00Z'};
  const f=dmConversationFilter(a,b,cursor,cursor);
  assert.equal((f.match(/sender_id.eq/g)||[]).length,2);
  assert.equal((f.match(/created_at.gt/g)||[]).length,2);
  assert.equal((f.match(/created_at.lt/g)||[]).length,2);
  assert.equal(f.split('),and(sender_id').length,2);
  assert.throws(()=>dmConversationFilter('invalid',b),/Invalid/);
});
test('attachment MIME fallback does not allow arbitrary binary payload types',()=>{
  assert.equal(attachmentMime('report.pdf',''), 'application/pdf');
  assert.equal(attachmentMime('backup.zip','application/octet-stream'),'application/zip');
  assert.equal(attachmentMime('script.exe','application/octet-stream'),null);
  assert.equal(attachmentMime('readme.txt','text/html'),null);
});
