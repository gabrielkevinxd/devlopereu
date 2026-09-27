/**
 * Voz em browsers REAIS (Chrome e Edge instalados), sem simular a Web Speech API:
 * microfone falso do Chromium a tocar um WAV de fala (--use-file-for-fake-audio-capture, sem repetição).
 * Cenários: permissão concedida (caminho gravação → transcrição → resposta falada), negada, silêncio,
 * primeira vez (aviso RGPD antes do microfone) e contexto inseguro (http://IP-da-rede).
 * Uso: BASE=http://127.0.0.1:5175 LAN=192.168.x.x SPEECH=… SILENCE=… node .verify/v5/voice-real.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:5175';
const LAN = process.env.LAN;
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const BROWSERS = { chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe', edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' };
const report = { checks: {}, errors: [] };
const check = (name, ok, detail = '') => {
  report.checks[name] = ok ? 'ok' : `FALHOU ${detail}`;
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

async function open(exe, { wav, grant = true, consent = true, url = BASE, w = 1440, h = 900 }) {
  const args = ['--use-fake-device-for-media-stream', ...(wav ? [`--use-file-for-fake-audio-capture=${wav}%noloop`] : []), ...(grant ? ['--use-fake-ui-for-media-stream'] : [])];
  const browser = await chromium.launch({ executablePath: exe, headless: true, args });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, permissions: grant ? ['microphone'] : [], reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  const posts = [];
  page.on('request', (r) => r.url().includes('agent.php') && r.method() === 'POST' && posts.push(JSON.parse(r.postData() || '{}').action));
  await page.addInitScript((consent) => {
    localStorage.setItem('dev-consent-v1', '{"marketing":false}');
    if (consent) localStorage.setItem('dev-ai-consent-v1', '"ok"');
    window.__played = 0;
    // regista TODAS as transições de estado da voz (mesmo as muito rápidas)
    window.__states = [];
    new MutationObserver(() => {
      const st = document.querySelector('.voice-status')?.dataset.state;
      if (st && window.__states[window.__states.length - 1] !== st) window.__states.push(st);
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'], childList: true });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__played++;
      return play.call(this);
    };
  }, consent);
  await page.goto(url, { waitUntil: 'networkidle' });
  return { browser, page, posts };
}

const status = (page) => page.evaluate(() => ({ state: document.querySelector('.voice-status')?.dataset.state, text: document.querySelector('.voice-status')?.textContent?.trim() ?? '' }));

async function waitState(page, states, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await status(page);
    if (states.includes(s.state)) return s;
    await page.waitForTimeout(100);
  }
  return status(page);
}

(async () => {
  for (const [name, exe] of Object.entries(BROWSERS)) {
    // 1) Caminho feliz: falar → «a ouvir» (com nível) → termina sozinho → «a transcrever» → mensagem enviada → resposta falada
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { browser, page, posts } = await open(exe, { wav: process.env.SPEECH, w, h });
      await page.click('.composer__mic');
      const listening = await waitState(page, ['listening'], 8000);
      await page.waitForTimeout(1200);
      if (name === 'chrome') await page.screenshot({ path: path.join(OUT, `${w}-voz-01-a-ouvir.png`) });
      const transcribing = await waitState(page, ['transcribing'], 25000);
      if (name === 'chrome') await page.screenshot({ path: path.join(OUT, `${w}-voz-02-a-transcrever.png`) });
      await page.waitForSelector('.msg--user', { timeout: 20000 });
      await page.waitForFunction(() => document.querySelector('.chat__answers')?.dataset.streaming === 'false' && !document.querySelector('.msg--typing'), null, { timeout: 20000 });
      const speakingOrDone = await waitState(page, ['speaking', 'blocked', 'idle'], 8000);
      await page.waitForTimeout(400);
      if (name === 'chrome') await page.screenshot({ path: path.join(OUT, `${w}-voz-03-resposta-falada.png`) });
      await page.waitForTimeout(1500);
      const played = await page.evaluate(() => window.__played);
      const user = await page.locator('.msg--user').last().innerText();
      const seen = await page.evaluate(() => window.__states);
      check(`${name} ${w}: botão → «a ouvir» com medidor de nível`, listening.state === 'listening', listening.text);
      check(`${name} ${w}: fim da fala detetado sozinho → «a transcrever»`, seen.includes('transcribing'), `sequência: ${seen.join(' → ')}`);
      check(`${name} ${w}: áudio gravado enviado para transcrição no servidor e texto enviado ao agente`, posts.includes('stt') && posts.includes('chat') && user.length > 5, `${posts.join(',')} · «${user.slice(0, 50)}»`);
      check(`${name} ${w}: resposta falada (TTS) reproduzida`, posts.includes('tts') && played > 0, `estado=${speakingOrDone.state} play=${played}`);
      await browser.close();
    }

    // 2) Permissão negada → mensagem clara + «Tentar de novo»
    {
      const { browser, page } = await open(exe, { wav: process.env.SPEECH, grant: false, w: 390, h: 844 });
      await page.click('.composer__mic');
      const s = await waitState(page, ['error'], 8000);
      if (name === 'chrome') await page.screenshot({ path: path.join(OUT, '390-voz-04-permissao-negada.png') });
      check(`${name}: permissão negada → mensagem e ação visíveis`, s.state === 'error' && /bloqueado/.test(s.text) && /Tentar de novo/.test(s.text), s.text);
      await browser.close();
    }

    // 3) Silêncio → «não ouvi nada» (antes: o botão voltava ao início sem dizer nada)
    {
      const { browser, page, posts } = await open(exe, { wav: process.env.SILENCE, w: 1440, h: 900 });
      await page.click('.composer__mic');
      const s = await waitState(page, ['error'], 15000);
      if (name === 'chrome') await page.screenshot({ path: path.join(OUT, '1440-voz-05-sem-fala.png') });
      check(`${name}: silêncio → «não ouvi nada» + tentar de novo (sem chamada paga)`, s.state === 'error' && /Não ouvi nada/.test(s.text) && !posts.includes('stt'), s.text);
      await browser.close();
    }

    // 4) Primeira vez: aviso RGPD antes de o áudio ir para a IA; «Aceitar» começa a ouvir
    {
      const { browser, page } = await open(exe, { wav: process.env.SPEECH, consent: false, w: 1440, h: 900 });
      await page.click('.composer__mic');
      await page.waitForSelector('.ai-consent', { timeout: 8000 });
      await page.click('.ai-consent .btn--gold');
      const s = await waitState(page, ['listening'], 8000);
      check(`${name}: 1.ª vez → aviso RGPD → «Aceitar» liga o microfone`, s.state === 'listening', s.text);
      await browser.close();
    }

    // 5) Contexto inseguro (http://IP-da-rede): o browser bloqueia o microfone → mensagem clara
    if (LAN) {
      const { browser, page } = await open(exe, { wav: process.env.SPEECH, url: `http://${LAN}:5175/`, w: 390, h: 844 });
      const secure = await page.evaluate(() => window.isSecureContext);
      await page.click('.composer__mic');
      const s = await waitState(page, ['error'], 8000);
      if (name === 'chrome') await page.screenshot({ path: path.join(OUT, '390-voz-06-ligacao-insegura.png') });
      check(`${name}: http://${LAN} (inseguro) → mensagem «precisa de https»`, secure === false && /https/.test(s.text), s.text);
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(__dirname, 'voice-real.json'), JSON.stringify(report, null, 2));
  console.log(report.errors.length ? `erros de página: ${report.errors.join(' | ')}` : 'sem erros de página');
  if (report.errors.length) process.exitCode = 1;
})();
