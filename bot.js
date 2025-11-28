const puppeteer = require("puppeteer");
const fs = require("fs");

function limpiarCookies(cookies) {
  return cookies.map(c => {
    delete c.priority;
    delete c.sameParty;
    delete c.partitionKey;
    delete c.sourcePort;
    delete c.sourceScheme;
    delete c.partition;
    return c;
  });
}

async function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
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
  cookies = limpiarCookies(cookies);
  await page.setCookie(...cookies);

  // ===============================
  // 2. Entrar a la página
  // ===============================
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  const boton = "button.RenewBox___StyledButton3-sc-1inh2rq-22";
  await page.waitForSelector(boton, { timeout: 60000 });

  // ===============================
  // 3. Mover mouse al botón antes del clic (simulación humana)
  // ===============================
  const botonElemento = await page.$(boton);
  const box = await botonElemento.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 15
  });

  console.log("🖱️ Mouse sobre el botón…");

  // ===============================
  // 4. Hacer clic real
  // ===============================
  await botonElemento.click();
  console.log("✔ Bot hizo clic en '+ Add 6 hours'");

  // ===============================
  // 5. Mantener mouse encima por 20s
  // ===============================
  console.log("⌛ Manteniendo mouse sobre el botón por 20 segundos…");

  const tiempo = 20000;
  const inicio = Date.now();

  while (Date.now() - inicio < tiempo) {
    // pequeño movimiento humano cada 1.5s
    await page.mouse.move(
      box.x + box.width / 2 + Math.random() * 10 - 5,
      box.y + box.height / 2 + Math.random() * 10 - 5,
      { steps: 5 }
    );
    await esperar(1500);
  }

  console.log("✔ Listo. Se simuló actividad humana por 20 segundos.");

  await browser.close();
}

runBot();
