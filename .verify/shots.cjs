const { chromium } = require("C:/Users/User1/Overclock/Meu Primeiro Projeto/node_modules/playwright");
const OUT = ".verify/redesign/";
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const errs = [];
  for (const [name, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: "pt-PT", reducedMotion: "reduce" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(name + " pageerror: " + e.message));
    p.on("console", (m) => m.type() === "error" && errs.push(name + " console: " + m.text()));
    await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    // dispensar banner de cookies
    const rej = p.locator("div.fixed.bottom-0 button").last();
    if (await rej.count()) await rej.click();
    await p.screenshot({ path: OUT + `${name}-01-hero.png` });
    for (const [id, label] of [["servicos","02-servicos"],["diagnostico","03-diagnostico"],["metodo","04-metodo"],["vantagens","05-vantagens"],["sobre","06-sobre"],["faq","08-faq"]]) {
      const el = p.locator("#" + id);
      await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
      await el.screenshot({ path: OUT + `${name}-${label}.png` });
    }
    // Diagnóstico: fluxo completo
    const diag = p.locator("#diagnostico");
    await diag.scrollIntoViewIfNeeded();
    await diag.getByText("Atendimento a clientes").click();
    await diag.getByText("Vendas e leads").click();
    await diag.getByRole("button", { name: /Continuar/ }).click();
    await diag.getByText("Várias ferramentas").click();
    await diag.getByRole("button", { name: /Continuar/ }).click();
    await diag.getByText("Começar já").click();
    await diag.getByRole("button", { name: /Continuar/ }).click();
    await p.waitForTimeout(600);
    await diag.screenshot({ path: OUT + `${name}-03b-diagnostico-resultado.png` });
    // Lead magnet
    const lead = p.locator("section[aria-labelledby=h-lead]");
    await lead.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    await lead.screenshot({ path: OUT + `${name}-07-checklist.png` });
    // Agendamento
    await diag.getByRole("link", { name: /Agendar reunião com este mapa/ }).click();
    await p.waitForTimeout(1200);
    const book = p.locator("#agendar");
    await p.locator("label:has(input[name=day])").nth(1).click();
    await p.locator("label:has(input[name=time])").nth(2).click();
    await book.screenshot({ path: OUT + `${name}-09-agendar-1-quando.png` });
    await book.getByRole("button", { name: "Continuar" }).click();
    await p.locator("#bk-name").fill("Ana Teste");
    await p.locator("#bk-email").fill("ana@example.com");
    await book.getByRole("button", { name: "Pedir reunião" }).click();
    await book.screenshot({ path: OUT + `${name}-09-agendar-2-erro-consentimento.png` });
    await p.locator("input[type=checkbox]").last().check();
    const [popup] = await Promise.all([ctx.waitForEvent("page").catch(() => null), book.getByRole("button", { name: "Pedir reunião" }).click()]);
    if (popup) { console.log(name, "popup:", popup.url().slice(0, 90)); await popup.close(); }
    await p.waitForTimeout(400);
    await book.screenshot({ path: OUT + `${name}-09-agendar-3-pronto.png` });
    // CTA fixa (após hero, fora do agendamento)
    await p.evaluate(() => document.getElementById("faq").scrollIntoView());
    await p.waitForTimeout(700);
    await p.screenshot({ path: OUT + `${name}-10-cta-fixa.png` });
    await p.locator("footer").scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
    await p.locator("footer").screenshot({ path: OUT + `${name}-11-rodape.png` });
    await p.screenshot({ path: OUT + `${name}-00-fullpage.png`, fullPage: true });
    const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(name, "overflow-x:", ov);
    await ctx.close();
  }
  console.log("ERRORS:", JSON.stringify(errs.slice(0, 10)));
  await b.close();
})();
