/* Syntax + wiring checks for the complete extension bundle. */
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
assert.equal(manifest.manifest_version,3);
assert.deepEqual(manifest.permissions,['storage']);
assert.ok(manifest.content_scripts.every(entry=>entry.matches.length===1&&entry.matches[0]==='https://scouts.su/*'));
assert.ok(manifest.content_scripts.find(entry=>entry.world==='MAIN'&&entry.run_at==='document_start'));
assert.ok(manifest.content_scripts.find(entry=>entry.js.includes('SCOUTS_Planet_Workspace.js')));
assert.ok(!manifest.content_scripts.some(entry=>entry.js.includes('SCOUTS_Calculator_v6.js')),'Legacy calculator must never auto-mount');
for(const entry of manifest.content_scripts){for(const js of entry.js){const code=fs.readFileSync(path.join(root,js),'utf8');new Function(code);}}
const source=fs.readFileSync(path.join(root,'SCOUTS_Planet_Workspace.js'),'utf8');
assert.ok(source.includes('__scoutsCalcDestroy'),'Legacy cleanup must work when old Snippet is still active');
assert.ok(source.includes('scouts-planet-launcher'),'Small floating launcher not found');
assert.ok(!source.includes("host.id='scouts-calc-root'"),'Legacy panel unexpectedly mounted');
const label='const workspaceHTML = ';
const i=source.indexOf(label)+label.length;
assert.ok(i>=label.length,'Two-mode workspace missing');
const j=source.indexOf(';\n  const DATA',i);
assert.ok(j>i,'Embedded HTML termination missing');
const html=JSON.parse(source.slice(i,j));
assert.ok(html.includes('acceptLivePacket'),'Iframe receiver missing');
assert.ok(html.includes('SCOUTS_PLANET_READY_V1'));
assert.ok(html.includes('data-mode="monitor"'));
assert.ok(html.includes('data-mode="build"'));
for(const part of html.split('<script>').slice(1)){
 const code=part.split('</script>')[0]; new Function(code);
}
console.log('PASS: only new two-mode launcher; manifest, capture, messaging and embedded JS');
