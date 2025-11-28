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

  // Esperar específicamente el botón correcto por texto
  await page.waitForFunction(() => {
    return [...document.querySelectorAll("button")].some(btn =>
      btn.textContent.includes("+ Add 6 hours")
    );
  }, { timeout: 60000 });

  // Hacer clic en el botón correcto
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(b =>
      b.textContent.includes("+ Add 6 hours")
    );
    if (btn) btn.click();
  });

  console.log("✔ Bot hizo clic en '+ Add 6 hours'");
  console.log("⌛ Esperando 11 segundos...");

  // ⛔ FIX: reemplazo de waitForTimeout
  await new Promise(resolve => setTimeout(resolve, 11000));

  console.log("✔ 11 segundos completados.");

  await browser.close();
}

runBot();
