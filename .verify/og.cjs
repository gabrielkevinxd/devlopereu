const { chromium } = require("C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright");
const path = require("path");
(async()=>{const b=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
const p=await b.newPage({viewport:{width:1200,height:630}});
await p.goto("file:///"+path.resolve(".verify/og.html").split(path.sep).join("/"),{waitUntil:"networkidle"});await p.waitForTimeout(800);
await p.screenshot({path:"public/og-image.png"});await b.close()})();
