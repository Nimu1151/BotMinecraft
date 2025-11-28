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

  // Ir al servidor
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  await page.waitForFunction(() => {
    return [...document.querySelectorAll("button")].some(btn =>
      btn.textContent.includes("+ Add 6 hours")
    );
  }, { timeout: 60000 });

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(b =>
      b.textContent.includes("+ Add 6 hours")
    );
    if (btn) btn.click();
  });

  console.log("✔ Bot hizo clic en '+ Add 6 hours'");
  console.log("⌛ Esperando 45 segundos (Cloudflare check)...");

  await sleep(45000);

  console.log("⏳ Verificando si el security check terminó...");

  const stillChecking = await page.evaluate(() => {
    return document.body.innerText.includes("Please complete the security check");
  });

  if (stillChecking) {
    console.log("❌ Todavía no pasó el security check. Intentando clic nuevamente...");

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(b =>
        b.textContent.includes("+ Add 6 hours")
      );
      if (btn) btn.click();
    });

    console.log("✔ Segundo intento realizado. Esperando 20 segundos...");
    await sleep(20000);
  }

  console.log("🔍 Verificando tiempo actualizado...");

  const time = await page.evaluate(() => {
    return document.body.innerText;
  });

  console.log("\n📌 Estado actual de la página:");
  console.log(time);

  await browser.close();
}

runBot();
