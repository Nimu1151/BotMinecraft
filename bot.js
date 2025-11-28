const puppeteer = require("puppeteer");
const fs = require("fs");

function limpiarCookies(cookies) {
  return cookies.map(c => {
    // GitHub Actions NO permite estas propiedades
    delete c.priority;
    delete c.sameParty;
    delete c.partitionKey;
    delete c.sourcePort;
    delete c.sourceScheme;
    delete c.partition;
    return c;
  });
}

async function runBot() {
  console.log("🚀 Iniciando bot...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // ===============================
  // 1. Cargar cookies LIMPIAS
  // ===============================
  let cookies = JSON.parse(fs.readFileSync("cookies.json"));

  // Limpieza para compatibilidad total
  cookies = limpiarCookies(cookies);

  await page.setCookie(...cookies);

  // ===============================
  // 2. Ir a la página del servidor
  // ===============================
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  const boton = "button.RenewBox___StyledButton3-sc-1inh2rq-22";

  await page.waitForSelector(boton, { timeout: 60000 });

  await page.click(boton);

  console.log("✔ Bot hizo clic en '+ Add 6 hours'");

  // ===============================
  // 3. Esperar Cloudflare
  // ===============================
  console.log("⌛ Esperando 20 segundos por Cloudflare...");
  await new Promise(r => setTimeout(r, 20000));

  console.log("✔ Finalizado.");

  await browser.close();
}

runBot();
