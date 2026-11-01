/* Runs in the Chrome isolated content-script world. Data never leaves the device. */
(() => {
  'use strict';
  if (location.hostname !== 'scouts.su' || !globalThis.chrome?.storage?.local) return;
  const DATA = 'SCOUTS_PLANET_DATA_V1';
  const REQUEST = 'SCOUTS_PLANET_REQUEST_V1';
  const CACHE = 'scoutsPlanetLatestSnapshotV1';
  let latest = null;
  let lastJSON = '';
  chrome.storage.local.get(CACHE).then(saved => {
    const cached = saved?.[CACHE];
    if (cached?.snapshot?.event === 'planetaryBase') {
      latest = cached.snapshot;
      lastJSON = JSON.stringify(latest);
    }
  }).catch(() => {});
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || !event.data) return;
    if (event.data.type === REQUEST) {
      const reply = () => { if (latest) window.postMessage({ type: DATA, snapshot: latest }, location.origin); };
      if (latest) reply();
      else chrome.storage.local.get(CACHE).then(saved => {
        if (saved?.[CACHE]?.snapshot) {
          latest = saved[CACHE].snapshot;
          lastJSON = JSON.stringify(latest);
          reply();
        }
      }).catch(() => {});
      return;
    }
    if (event.data.type !== DATA) return;
    const value = event.data.snapshot;
    if (value?.event !== 'planetaryBase' || !Array.isArray(value?.data?.base?.cells)) return;
    if (value.data.base.cells.length < 1 || value.data.base.cells.length > 2500) return;
    const json = JSON.stringify(value);
    if (json.length > 2_000_000 || json === lastJSON) return;
    latest = value;
    lastJSON = json;
    chrome.storage.local.set({ [CACHE]: { snapshot: value } }).catch(error => {
      console.warn('[SCOUTS Planet] Не удалось сохранить снимок локально:', error);
    });
  });
})();