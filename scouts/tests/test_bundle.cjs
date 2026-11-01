/* Syntax + wiring checks for the complete extension bundle. */
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
assert.equal(manifest.manifest_version,3);
assert.deepEqual(manifest.permissions,['storage']);
assert.ok(manifest.content_scripts.every(entry=>entry.matches.length===1&&entry.matches[0]==='https://scouts.su/*'));
assert.ok(manifest.content_scripts.find(entry=>entry.world==='MAIN'&&entry.run_at==='document_start'));
assert.ok(manifest.content_scripts.find(entry=>entry.js.includes('SCOUTS_Calculator_v6.js')));
for(const entry of manifest.content_scripts){for(const js of entry.js){const code=fs.readFileSync(path.join(root,js),'utf8');new Function(code);}}
const source=fs.readFileSync(path.join(root,'SCOUTS_Calculator_v6.js'),'utf8');
assert.ok(source.includes('onPlanetBridgeMessage'),'Parent bridge missing');
const label='const PLANET_WORKSPACE_HTML=';
const i=source.indexOf(label)+label.length;
assert.ok(i>=label.length,'Embedded workspace missing');
const j=source.indexOf(';\n',i);
const html=JSON.parse(source.slice(i,j));
assert.ok(html.includes('acceptLivePacket'),'Iframe bridge missing');
assert.ok(html.includes('SCOUTS_PLANET_READY_V1'));
for(const part of html.split('<script>').slice(1)){const code=part.split('</script>')[0];new Function(code);}
console.log('PASS: manifest, all content scripts, parent/iframe bridge, embedded JS');