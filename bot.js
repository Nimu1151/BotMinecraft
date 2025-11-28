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

  console.log("Página cargada. Buscando botón Renew...");

  // Esperar al botón (usa el selector real)
  await page.waitForSelector('span.Button___StyledSpan-sc-1qu1gou-2', {
    timeout: 60000
  });

  // Dar clic
  await page.click('span.Button___StyledSpan-sc-1qu1gou-2');

  console.log("✔ Bot hizo clic en el botón Renew");

  await browser.close();
}

runBot();
