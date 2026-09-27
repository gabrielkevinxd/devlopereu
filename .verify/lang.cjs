const { chromium } = require("C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright");
(async()=>{const b=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
const p=await b.newPage({viewport:{width:1440,height:900},locale:"pt-PT"});const errs=[];p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://localhost:4173/",{waitUntil:"networkidle"});
console.log("lang attr:",await p.evaluate(()=>document.documentElement.lang),"| title:",await p.title());
for (const l of ["en","de"]) { await p.selectOption("nav select",l); await p.waitForTimeout(800); console.log(l,"h1:",(await p.locator("h1").innerText()).replace(/\n/g," "),"| lang:",await p.evaluate(()=>document.documentElement.lang)); }
console.log("errors:",errs.length);
await p.screenshot({path:".verify/redesign/desktop-13-idioma-de.png"});
await b.close()})();
