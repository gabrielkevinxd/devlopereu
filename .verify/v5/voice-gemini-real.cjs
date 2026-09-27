// Prova real: Chrome real + microfone falso a tocar fala PT-PT gerada pela Gemini → STT real → agente real → TTS real.
const path = require('node:path');
const { chromium } = require('C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${process.env.WAV}%noloop`] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['microphone'] });
  const p = await ctx.newPage();
  const net = [];
  p.on('response', (r) => r.url().includes('agent.php') && r.request().method() === 'POST' && net.push(`${JSON.parse(r.request().postData()).action}→${r.status()}`));
  await p.addInitScript(() => {
    localStorage.setItem('dev-consent-v1', '{"marketing":false}');
    localStorage.setItem('dev-ai-consent-v1', '"ok"');
    window.__played = 0; window.__states = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__played++; return play.call(this); };
    new MutationObserver(() => { const s = document.querySelector('.voice-status')?.dataset.state; if (s && window.__states.at(-1) !== s) window.__states.push(s); })
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'], childList: true });
  });
  await p.goto('http://127.0.0.1:5176/', { waitUntil: 'networkidle' });
  await p.click('.composer__mic');
  await p.waitForSelector('.msg--user', { timeout: 40000 }).catch(async () => { console.log('estado:', await p.evaluate(() => document.querySelector('.voice-status')?.dataset.state + ' | ' + document.querySelector('.voice-status')?.textContent)); throw new Error('sem transcrição'); });
  await p.waitForFunction(() => document.querySelector('.chat__answers')?.dataset.streaming === 'false' && !document.querySelector('.msg--typing'), null, { timeout: 60000 });
  await p.waitForFunction(() => window.__played > 0 || document.querySelector('.voice-status')?.dataset.state === 'blocked', null, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(__dirname, 'shots', '1440-voz-07-prova-real-gemini.png') });
  const r = await p.evaluate(() => ({ user: document.querySelectorAll('.msg--user')[0]?.textContent.replace(/^Você:\s*/, ''), agent: [...document.querySelectorAll('.msg--agent')].pop()?.textContent.replace(/^Agente DevloperEU:\s*/, ''), states: window.__states, played: window.__played }));
  console.log('Transcrição (STT Gemini):', r.user);
  console.log('Resposta do agente:', r.agent);
  console.log('Estados da voz:', r.states.join(' → '), '· áudio reproduzido:', r.played);
  console.log('Pedidos:', net.join(', '));
  await b.close();
})();
