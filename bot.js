const puppeteer = require("puppeteer");
const fs = require("fs");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  await page.waitForSelector("span.Button___StyledSpan-sc-1qu1gou-2", {
    timeout: 60000
  });

  // Encontrar el botón exacto
  const pos = await page.evaluate(() => {
    const spans = [...document.querySelectorAll("span.Button___StyledSpan-sc-1qu1gou-2")];
    const btn = spans.find(el => el.textContent.includes("+ Add 6 hours"));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });

  if (!pos) {
    console.log("❌ No se encontró el botón.");
    await browser.close();
    return;
  }

  // Scroll y clic
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await sleep(1500);

  await page.mouse.click(pos.x, pos.y);
  console.log("✔ Bot hizo clic en '+ Add 6 hours'");

  // Esperar a que salga el challenge
  console.log("⌛ Esperando que aparezca el challenge...");

  await sleep(5000);

  // Tomar captura del challenge “Verificando…”
  await page.screenshot({ path: "cloudflare_check.png" });
  console.log("📸 Captura guardada: cloudflare_check.png");

  console.log("⌛ Esperando validación Cloudflare (20 segundos)...");
  await sleep(20000);

  console.log("✔ Cloudflare terminado. Finalizando proceso.");

  await browser.close();
}

runBot();
