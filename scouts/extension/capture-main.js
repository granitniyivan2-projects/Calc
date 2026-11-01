/* SCOUTS read-only WebSocket observer. Runs early in the game's MAIN world.
 * It never sends a WebSocket message and exposes only whitelisted planet data.
 */
(() => {
  'use strict';
  if (location.hostname !== 'scouts.su' || window.__scoutsPlanetCaptureV1) return;
  window.__scoutsPlanetCaptureV1 = true;
  const KIND = 'SCOUTS_PLANET_DATA_V1';
  const original = window.WebSocket;
  if (typeof original !== 'function') return;

  const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const token = value => typeof value === 'string' ? value.slice(0, 80) : typeof value === 'number' ? value : null;
  const maxRecords = 2500;
  function plainNumbers(obj, maxFields = 64) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const output = {};
    for (const [key, value] of Object.entries(obj).slice(0, maxFields)) {
      if (/^[A-Za-z][A-Za-z0-9_]{0,59}$/.test(key) && number(value) !== null) output[key] = value;
    }
    return output;
  }
  function cleanCell(item) {
    if (!item || typeof item !== 'object') return null;
    const x = number(item.x ?? item.position?.x), y = number(item.y ?? item.position?.y);
    if (!Number.isInteger(x) || !Number.isInteger(y) || Math.abs(x) > 1000 || Math.abs(y) > 1000) return null;
    const b = item.building;
    const building = b && typeof b === 'object' ? {
      type: token(b.type ?? b.code ?? b.buildingCode),
      level: number(Number(b.level ?? 1)) ?? 1,
      recipe: token(b.recipe) ?? '',
      active: b.active !== false
    } : null;
    const vein = item.resource;
    return {
      x, y,
      terrain: token(item.terrain) || 'unknown',
      has_mountain: !!(item.has_mountain ?? item.hasMountain ?? item.mountain),
      resource: typeof vein === 'string' ? token(vein) : token(vein?.code ?? vein?.type ?? vein?.resource),
      has_foundation: !!(item.has_foundation ?? item.hasFoundation ?? item.foundation),
      building
    };
  }
  function pickPacket(value) {
    const events = Array.isArray(value) ? value : Array.isArray(value?.events) ? value.events : [value];
    for (const event of events) {
      if (!event || event.event !== 'planetaryBase') continue;
      const packet = event.data || {};
      const raw = packet.base || packet.planetaryBase?.base || packet.planetaryBase || packet;
      const source = raw?.cells || raw?.map?.cells || raw?.grid?.cells;
      if (!source || typeof source !== 'object') continue;
      const cellsIn = Array.isArray(source) ? source : Object.values(source);
      if (cellsIn.length < 1 || cellsIn.length > maxRecords) continue;
      const cells = cellsIn.map(cleanCell).filter(Boolean);
      if (cells.length !== cellsIn.length) continue; // do not forward partial maps
      const stock = raw.storage?.resources || raw.stock || {};
      const energy = raw.energy || {};
      const cleaned = {
        event: 'planetaryBase',
        data: {
          planetName: token(packet.planetName ?? packet.name ?? raw.name) || 'Планета',
          planetId: token(packet.planetId ?? raw.planetId),
          day: number(Number(packet.day ?? raw.day ?? 0)) ?? 0,
          base: {
            id: token(raw.id), name: token(raw.name),
            cells,
            storage: {
              resources: plainNumbers(stock),
              taken: number(raw.storage?.taken),
              capacity: number(raw.storage?.capacity)
            },
            energy: {
              reserve: number(energy.reserve ?? energy.current ?? raw.energyStock),
              production: number(energy.production),
              consumption: number(energy.consumption),
              capacity: number(energy.capacity)
            }
          }
        }
      };
      return cleaned;
    }
    return null;
  }
  function inspect(data) {
    try {
      if (typeof data !== 'string' || data.length > 5_000_000 || !data.includes('planetaryBase')) return;
      const payload = pickPacket(JSON.parse(data));
      if (!payload) return;
      window.postMessage({ type: KIND, snapshot: payload }, location.origin);
    } catch (_) { /* unsupported or malformed packet: leave game untouched */ }
  }
  try {
    const wrapped = new Proxy(original, {
      construct(target, args, newTarget) {
        const socket = Reflect.construct(target, args, newTarget === wrapped ? target : newTarget);
        socket.addEventListener('message', event => inspect(event.data));
        return socket;
      }
    });
    window.WebSocket = wrapped;
  } catch (error) {
    console.warn('[SCOUTS Planet] Не удалось включить пассивное чтение WebSocket:', error);
  }
})();