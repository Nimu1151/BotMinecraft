const puppeteer = require("puppeteer");
const fs = require("fs");

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function runBot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // Cargar cookies
  const cookies = JSON.parse(fs.readFileSync("cookies.json"));
  await page.setCookie(...cookies);

  // Abrir página
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón...");

  // Esperar que aparezca cualquier botón de renovar
  await page.waitForSelector("button", { timeout: 60000 });

  // Clic REAL al botón
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const target = buttons.find(b => b.innerText.includes("+ Add 6 hours"));
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.log("❌ No se encontró el botón '+ Add 6 hours'.");
    await browser.close();
    return;
  }

  console.log("✔ Bot hizo clic en el botón REAL '+ Add 6 hours'");

  // Esperar challenge
  console.log("⌛ Esperando que aparezca el challenge...");
  await sleep(5000);

  // Captura del challenge
  await page.screenshot({ path: "cloudflare_check.png" });
  console.log("📸 Captura guardada: cloudflare_check.png");

  console.log("⌛ Esperando 20 segundos por Cloudflare...");
  await sleep(20000);

  console.log("✔ Cloudflare terminado. Listo.");

  await browser.close();
}

runBot();
