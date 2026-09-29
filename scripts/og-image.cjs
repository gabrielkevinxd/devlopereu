/**
 * Gera public/og-image.jpg (1200×630) com o logótipo REAL, via Playwright.
 * Uso: PLAYWRIGHT=<caminho do pacote playwright> node scripts/og-image.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const root = path.resolve(__dirname, '..');
const url = (p) => 'file:///' + path.join(root, p).replace(/\\/g, '/');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Sora;src:url('${url('public/fonts/sora-latin.woff2')}') format('woff2');font-weight:300 700}
@font-face{font-family:JBM;src:url('${url('public/fonts/jetbrains-mono-latin.woff2')}') format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:Sora;color:#f4efe3;
background:radial-gradient(700px 460px at 24% 50%,rgba(226,184,66,.22),transparent 70%),
radial-gradient(circle,rgba(226,184,66,.12) 1px,transparent 1.3px) 0 0/24px 24px,#070605;
display:grid;grid-template-columns:470px 1fr;align-items:center;padding:0 70px 0 50px;gap:40px}
img{width:430px;justify-self:center}
.e{font-family:JBM;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#e2b842;display:flex;gap:12px;align-items:center}
.e i{width:12px;height:12px;border-radius:50%;background:#9fd68a;box-shadow:0 0 14px #9fd68a}
h1{font-size:54px;line-height:1.04;letter-spacing:-.035em;font-weight:600;margin:22px 0 26px;
background:linear-gradient(100deg,#f4efe3 35%,#f5de8c 70%,#e2b842);-webkit-background-clip:text;color:transparent}
p{font-size:23px;color:#a39b88}
.u{margin-top:34px;font-family:JBM;font-size:22px;color:#f5de8c}
</style></head><body>
<img src="${url('public/brand/logo-stacked-gold.png')}">
<div><div class="e"><i></i>agente online · Braga, PT</div>
<h1>Agentes de IA que tratam o trabalho repetitivo da sua empresa</h1>
<p>Automação e hiperautomação para empresas em Portugal e na Europa.</p>
<div class="u">devlopereu.com</div></div>
</body></html>`;

(async () => {
  const tmp = path.join(root, '.verify', 'og.html');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(url('.verify/og.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, 'public', 'og-image.jpg'), type: 'jpeg', quality: 88 });
  await browser.close();
  fs.unlinkSync(tmp);
  console.log('og-image.jpg ok');
})();
