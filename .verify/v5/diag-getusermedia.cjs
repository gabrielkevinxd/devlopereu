const { chromium } = require('C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright');
const BROWSERS = { chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe', edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' };
(async () => {
  for (const [name, exe] of Object.entries(BROWSERS)) {
    const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${process.env.WAV}`] });
    const ctx = await b.newContext({ permissions: ['microphone'] });
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle' });
    const r = await p.evaluate(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = new AudioContext();
      const an = ac.createAnalyser();
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let peak = 0;
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.start();
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 100));
        an.getFloatTimeDomainData(buf);
        peak = Math.max(peak, ...buf.map(Math.abs));
      }
      rec.stop();
      await new Promise((r) => (rec.onstop = r));
      const blob = new Blob(chunks);
      return { mime: rec.mimeType, bytes: blob.size, peak: +peak.toFixed(3) };
    });
    console.log(`${name}: getUserMedia OK · MediaRecorder ${r.mime} · ${r.bytes} bytes em 4 s · pico de sinal ${r.peak}`);
    await b.close();
  }
})();
