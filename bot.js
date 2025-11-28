const puppeteer = require("puppeteer");
const fs = require("fs");

async function runBot() {
  console.log("🚀 Iniciando bot...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // ---------------------------
  // 1. Cargar cookies
  // ---------------------------
  const cookies = JSON.parse(fs.readFileSync("cookies.json"));
  await page.setCookie(...cookies);

  // ---------------------------
  // 2. Ir al servidor
  // ---------------------------
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  // ---------------------------
  // 3. Buscar el botón REAL
  // ---------------------------
  const renewSelector = "button.RenewBox___StyledButton3-sc-1inh2rq-22";

  await page.waitForSelector(renewSelector, { timeout: 60000 });

  // Clic real
  await page.click(renewSelector);
  console.log("✔ Bot hizo clic en '+ Add 6 hours'");


  // ---------------------------
  // 4. Esperar a que aparezca Cloudflare
  // ---------------------------
  console.log("⌛ Esperando que aparezca Cloudflare...");

  await page.waitForTimeout(5000); // 5 segundos para que aparezca

  // ---------------------------
  // 5. Tomar captura del challenge
  // ---------------------------
  try {
    await page.screenshot({ path: "cloudflare_check.png" });
    console.log("📸 Captura guardada: cloudflare_check.png");
  } catch {
    console.log("⚠ No se pudo capturar la pantalla.");
  }

  // ---------------------------
  // 6. Esperar validación automática
  // ---------------------------
  console.log("⌛ Esperando validación Cloudflare (20 segundos)...");
  await page.waitForTimeout(20000);

  console.log("✔ Cloudflare terminado. Finalizando proceso.");

  await browser.close();
}

runBot();

