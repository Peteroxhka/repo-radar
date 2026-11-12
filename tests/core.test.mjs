import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSearch, mergeMessages, isCurrentChat} from '../lib/core.mjs';
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
