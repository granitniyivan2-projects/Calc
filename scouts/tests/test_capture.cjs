/* Offline test: only whitelisted game data crosses the capture bridge. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const mainScript = fs.readFileSync(path.join(base, 'extension/capture-main.js'), 'utf8');
const isolatedScript = fs.readFileSync(path.join(base, 'extension/bridge-isolated.js'), 'utf8');
class FakeSocket {
  constructor(url) { this.url = url; this.handlers = {}; this.sent = []; }
  addEventListener(type, callback) { (this.handlers[type] ||= []).push(callback); }
  dispatch(type, data) { for (const fn of this.handlers[type] || []) fn({ data }); }
  send(message) { this.sent.push(message); }
}
const messages = [];
const win = {
  WebSocket: FakeSocket,
  postMessage(obj) { messages.push(JSON.parse(JSON.stringify(obj))); },
};
const loc = {hostname:'scouts.su', origin:'https://scouts.su'};
vm.runInNewContext(mainScript, {window:win,location:loc,Proxy,Reflect,Object,Array,JSON,Number,String,Math,console}, {timeout:1000});
assert.equal(win.__scoutsPlanetCaptureV1, true);
const socket = new win.WebSocket('wss://scouts.su/socket');
assert.ok(socket instanceof FakeSocket);
const full = {
  event:'planetaryBase', data:{planetId:'p42',planetName:'Test',token:'SECRET',base:{
    id:'b42',auth:'SECRET',energy:{reserve:123,production:200,consumption:70},
    storage:{resources:{ferrum:500,minerals:2000},cookie:'SECRET'},
    cells:[{x:0,y:0,terrain:'grass_1',building:{type:'60',level:2,recipe:'',active:true,auth:'SECRET'},cookie:'SECRET'},
      {x:1,y:0,terrain:'water_1',resource:'helium',has_foundation:true}]
  }}
};
socket.dispatch('message',JSON.stringify([{event:'chat',data:{token:'SECRET'}},full]));
assert.equal(messages.length,1);
const snap=messages[0].snapshot;
assert.equal(snap.event,'planetaryBase');
assert.equal(snap.data.base.cells.length,2);
assert.equal(snap.data.base.storage.resources.ferrum,500);
assert.equal(snap.data.base.cells[0].building.level,2);
assert.equal(JSON.stringify(snap).includes('SECRET'),false);
assert.equal(JSON.stringify(snap).includes('cookie'),false);
assert.deepEqual(socket.sent,[]);
socket.dispatch('message', JSON.stringify({event:'planetaryBase/cellUpdate',data:{auth:'SECRET'}}));
socket.dispatch('message', JSON.stringify({event:'chat',data:{token:'SECRET'}}));
assert.equal(messages.length,1);
// Simulate isolated context message delivery to extension-local storage.
const bus=[];
const storage={};
const chrome={storage:{local:{
  get:async key=>({[key]:storage[key]}),
  set:async obj=>{Object.assign(storage,obj)}
}}};
const isolatedWin={addEventListener:(type,fn)=>bus.push(fn),postMessage:o=>messages.push(o)};
vm.runInNewContext(isolatedScript,{window:isolatedWin,location:loc,globalThis:{chrome},chrome,console,JSON,Array,Promise}, {timeout:1000});
(async()=>{
 await Promise.resolve();
 bus[0]({source:isolatedWin,origin:loc.origin,data:messages[0]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(storage.scoutsPlanetLatestSnapshotV1);
 assert.equal(storage.scoutsPlanetLatestSnapshotV1.snapshot.data.base.cells.length,2);
 assert.equal(JSON.stringify(storage).includes('SECRET'),false);
 const old=messages.length;
 bus[0]({source:isolatedWin,origin:loc.origin,data:{type:'SCOUTS_PLANET_REQUEST_V1'}});
 assert.equal(messages.length,old+1);
 assert.equal(messages.at(-1).snapshot.data.base.cells.length,2);
 console.log('PASS: capture, sanitization, no game sends, cache and replay');
})().catch(e=>{console.error(e);process.exitCode=1});