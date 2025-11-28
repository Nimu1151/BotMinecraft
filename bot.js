const puppeteer = require("puppeteer");
const fs = require("fs");

async function runBot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // Cargar cookies
  const cookies = JSON.parse(fs.readFileSync("cookies.json"));
  await page.setCookie(...cookies);

  // Ir directamente al servidor
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  // Esperar específicamente el botón con ese texto
  await page.waitForFunction(() => {
    const buttons = [...document.querySelectorAll("span.Button___StyledSpan-sc-1qu1gou-2")];
    return buttons.some(btn => btn.textContent.includes("+ Add 6 hours"));
  }, { timeout: 60000 });

  // Dar clic al botón correcto
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("span.Button___StyledSpan-sc-1qu1gou-2")];
    const target = buttons.find(btn =>
      btn.textContent.includes("+ Add 6 hours")
    );
    if (target) target.click();
  });

  console.log("✔ Bot hizo clic en '+ Add 6 hours'");

  await browser.close();
}

runBot();
