/* Minimal runtime integration test: DOM mounting, old panel cleanup and local bridge. */
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../SCOUTS_Planet_Workspace.js'),'utf8');
const nodes=new Map(), listeners=new Map(), forwarded=[];
function element(tag){
  const events=new Map();
  return {
    tagName:tag.toUpperCase(), id:'',style:{},attrs:{},children:[],
    setAttribute(key,value){this.attrs[key]=value;},
    addEventListener(key,fn){events.set(key,fn);},
    removeEventListener(key,fn){if(events.get(key)===fn)events.delete(key);},
    click(){events.get('click')?.({});},
    append(...children){this.children.push(...children);},
    remove(){if(nodes.get(this.id)===this)nodes.delete(this.id);this.removed=true;},
    contentWindow:tag==='iframe'?{postMessage(value,origin){forwarded.push({value,origin});}}:undefined
  };
}
let cleaned=0;
const win={
  addEventListener(type,fn){listeners.set(type,fn);},
  removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type);},
  postMessage(payload,origin){forwarded.push({value:payload,origin});},
  __scoutsCalcDestroy(){cleaned++; nodes.get('scouts-calc-root')?.remove(); delete this.__scoutsCalcDestroy;}
};
win.top=win;
const doc={
  getElementById(id){return nodes.get(id)||null;},
  createElement:element,
  documentElement:{append(...els){for(const el of els)nodes.set(el.id,el);}}
};
const oldRoot=element('div');oldRoot.id='scouts-calc-root';nodes.set(oldRoot.id,oldRoot);
const context={window:win,location:{hostname:'scouts.su',origin:'https://scouts.su'},document:doc,console:{info(){},warn(){}}};
vm.runInNewContext(source,context,{timeout:3000,filename:'SCOUTS_Planet_Workspace.js'});
assert.equal(cleaned,1,'Old active snippet was not destroyed');
assert.equal(nodes.has('scouts-calc-root'),false,'Old panel still mounted');
const root=nodes.get('scouts-planet-workspace'),button=nodes.get('scouts-planet-launcher');
assert.ok(root&&button,'New UI not mounted');
assert.equal(root.style.cssText.includes('display:none'),true,'New app must not block the game on startup');
assert.equal(root.children.length,2,'New UI must include iframe and close button');
const frame=root.children[0],close=root.children[1];
assert.ok(frame.srcdoc.includes('acceptLivePacket'),'Embedded two-mode app missing');
button.click();
assert.equal(root.style.display,'block');
assert.equal(button.style.display,'none');
assert.equal(forwarded.at(-1).value.type,'SCOUTS_PLANET_REQUEST_V1');
const packet={event:'planetaryBase',data:{base:{cells:[{x:0,y:0}]}}};
listeners.get('message')({source:win,origin:'https://scouts.su',data:{type:'SCOUTS_PLANET_DATA_V1',snapshot:packet}});
listeners.get('message')({source:frame.contentWindow,origin:'https://scouts.su',data:{type:'SCOUTS_PLANET_READY_V1'}});
assert.ok(forwarded.some(x=>x.value.type==='SCOUTS_PLANET_DATA_V1'),'Snapshot was not forwarded to iframe');
close.click();
assert.equal(root.style.display,'none');
assert.equal(button.style.display,'block');
win.__scoutsPlanetOnlyDestroy();
assert.equal(nodes.has('scouts-planet-workspace'),false);
assert.equal(nodes.has('scouts-planet-launcher'),false);
console.log('PASS: old UI cleanup, single launcher, open/close, snapshot delivery, cleanup');
