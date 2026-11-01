/*
 * SCOUTS · GitHub Live Loader
 * Paste ONCE into Chrome DevTools > Sources > Snippets.
 * Run the snippet after opening the SCOUTS game page.
 * Each run downloads the latest version from the scouts-live branch.
 */
(async () => {
  'use strict';
  const raw = 'https://raw.githubusercontent.com/granitniyivan2-projects/Calc/scouts-live/scouts/SCOUTS_Calculator_v6.js';
  const cdn = 'https://cdn.jsdelivr.net/gh/granitniyivan2-projects/Calc@scouts-live/scouts/SCOUTS_Calculator_v6.js';
  const stamp = Date.now();
  try {
    const response = await fetch(raw + '?v=' + stamp, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
    const code = await response.text();
    if (code.length < 20000 || !code.includes('window.__scoutsCalcDestroy')) {
      throw new Error('Получен неполный или неожиданный код SCOUTS');
    }
    (0, eval)(code + '\n//# sourceURL=SCOUTS_Calculator_v6_GitHub.js');
    if (!document.getElementById('scouts-calc-root')) throw new Error('Панель не появилась после выполнения');
    console.info('[SCOUTS] Последняя версия загружена напрямую из GitHub.');
  } catch (primaryError) {
    console.warn('[SCOUTS] Прямая загрузка недоступна; пробую JS CDN:', primaryError);
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = cdn + '?v=' + stamp;
        script.onload = () => { script.remove(); resolve(); };
        script.onerror = () => { script.remove(); reject(new Error('Сайт блокирует внешние скрипты или CDN недоступен')); };
        (document.head || document.documentElement).appendChild(script);
      });
      if (!document.getElementById('scouts-calc-root')) throw new Error('Панель не появилась после CDN');
      console.info('[SCOUTS] Калькулятор загружен через JS CDN (возможен кеш).');
    } catch (cdnError) {
      console.error('[SCOUTS] Не удалось запустить из GitHub. Проверь Console: сеть/CSP.', { primaryError, cdnError });
    }
  }
})();
