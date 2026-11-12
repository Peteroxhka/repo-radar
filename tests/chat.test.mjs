import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {mergeMessages,isCurrentChat} from '../lib/core.mjs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function harness(responses){
 const nodes=new Map();const node=()=>({dataset:{},children:[],scrollHeight:500,scrollTop:400,clientHeight:100,replaceChildren(...c){this.children=c},append(...c){this.children.push(...c)}});
 const $=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 const state={user:{id:'user'},peer:{id:'peer'},chatEpoch:1,seen:new Map(),historyMore:false,messageBusy:false};
 const queries=[];
 const sb={from(){const calls=[];queries.push(calls);const q={};for(const name of ['select','or','order'])q[name]=(...args)=>{calls.push([name,...args]);return q};q.limit=()=>{const next=responses.shift();return typeof next==='function'?next():Promise.resolve({data:next,error:null})};return q;}};
 const ctx=vm.createContext({state,sb,$,document:{createDocumentFragment:node,createElement:node},mergeMessages,isCurrentChat,locale:'en',setStatus(){},safeErr:e=>e.message,console});
 vm.runInContext(source.slice(source.indexOf('async function loadMessages('),source.indexOf('$("file-input").onchange')),ctx);
 return {ctx,state,nodes,queries};
}
const rows=(start,end)=>Array.from({length:end-start},(_,i)=>({id:String(end-i-1).padStart(4,'0'),created_at:'2026-11-12T12:00:00Z',sender_id:'user',content:'message'}));
test('actual chat loader pages past 100 and preserves history on refresh',async()=>{
 const h=harness([rows(130,230),rows(30,130),rows(0,30),rows(230,231)]);
 await h.ctx.loadMessages();assert.equal(h.state.seen.size,100);assert.equal(h.state.historyMore,true);
 await h.ctx.loadMessages(true);assert.equal(h.state.seen.size,200);
 await h.ctx.loadMessages(true);assert.equal(h.state.seen.size,230);assert.equal(h.state.historyMore,false);
 await h.ctx.loadMessages();assert.equal(h.state.seen.size,231);assert.equal(h.state.seen.has('0000'),true);
 assert.ok(h.queries[1].some(q=>q[0]==='or'&&q[1].includes('id.lt.0130')));
});
test('actual chat loader catches up more than 100 unseen messages',async()=>{
 const h=harness([rows(0,1),rows(151,251),rows(51,151),rows(1,51)]);
 await h.ctx.loadMessages();await h.ctx.loadMessages();assert.equal(h.state.seen.size,251);
});
test('response after A-B-A switch cannot render or unlock the new request',async()=>{
 let resolve;const h=harness([()=>new Promise(r=>resolve=r)]);
 const pending=h.ctx.loadMessages();h.state.chatEpoch=3;h.state.messageBusy=true;
 resolve({data:rows(0,100),error:null});await pending;
 assert.equal(h.state.seen.size,0);assert.equal(h.state.messageBusy,true);
});
