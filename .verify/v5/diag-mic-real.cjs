// Diagnóstico do microfone em browsers REAIS (Chrome e Edge) com microfone falso a tocar um WAV de fala.
const { chromium } = require('C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');
const WAV = process.env.WAV; const URL = process.env.URL || 'http://127.0.0.1:5175/';
const BROWSERS = { chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe', edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' };
(async () => {
  for (const [name, exe] of Object.entries(BROWSERS)) {
    for (const perm of ['granted', 'denied']) {
      const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${WAV}`, ...(perm === 'granted' ? ['--use-fake-ui-for-media-stream'] : [])] });
      const ctx = await b.newContext({ permissions: perm === 'granted' ? ['microphone'] : [] });
      const p = await ctx.newPage();
      const logs = [];
      p.on('console', (m) => logs.push(`console.${m.type()}: ${m.text()}`));
      p.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
      p.on('request', (r) => r.url().includes('agent.php') && r.method() === 'POST' && logs.push(`POST ${JSON.parse(r.postData()).action}`));
      await p.addInitScript(() => {
        localStorage.setItem('dev-consent-v1', '{"marketing":false}');
        localStorage.setItem('dev-ai-consent-v1', '"ok"');
        window.__sr = [];
        const Native = window.SpeechRecognition || window.webkitSpeechRecognition;
        window.__hasSR = !!Native;
        if (Native) {
          const Wrapped = function () {
            const r = new Native();
            for (const ev of ['start', 'audiostart', 'soundstart', 'speechstart', 'result', 'error', 'end', 'nomatch'])
              r.addEventListener(ev, (e) => window.__sr.push(ev + (e.error ? `:${e.error}` : '') + (e.results ? `:${[...e.results].map((x) => x[0].transcript).join('|')}` : '')));
            return r;
          };
          window.SpeechRecognition = Wrapped; window.webkitSpeechRecognition = Wrapped;
        }
      });
      await p.goto(URL, { waitUntil: 'networkidle' });
      const secure = await p.evaluate(() => window.isSecureContext);
      await p.click('.composer__mic');
      const states = [];
      for (let i = 0; i < 14; i++) {
        await p.waitForTimeout(1000);
        states.push(await p.evaluate(() => `${document.querySelector('.composer__mic')?.getAttribute('aria-label')}|${document.querySelector('.composer__status')?.textContent}|${document.querySelector('#composer-input')?.value}`));
      }
      const r = await p.evaluate(() => ({ hasSR: window.__hasSR, sr: window.__sr, msgs: [...document.querySelectorAll('.msg')].slice(2).map((m) => m.textContent.slice(0, 90)) }));
      console.log(`\n===== ${name} · permissão ${perm} · secureContext=${secure} · SpeechRecognition=${r.hasSR}`);
      console.log('eventos SR:', r.sr.join(' → ') || '(nenhum)');
      console.log('estados botão|status|input (1 s):', [...new Set(states)].join('  //  '));
      console.log('mensagens:', r.msgs);
      console.log(logs.filter((l) => !/Download the React|vite/.test(l)).slice(0, 8).join('\n'));
      await b.close();
    }
  }
})();
