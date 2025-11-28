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

  // Cargar el servidor
  await page.goto("https://panel.freegamehost.xyz/server/0bfe8b47", {
    waitUntil: "networkidle2"
  });

  console.log("Página cargada. Buscando botón '+ Add 6 hours'...");

  // Esperar el botón + Add 6 hours
  await page.waitForFunction(() => {
    return [...document.querySelectorAll("button")].some(btn =>
      btn.textContent.includes("+ Add 6 hours")
    );
  }, { timeout: 60000 });

  // Hacer clic
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(btn =>
      btn.textContent.includes("+ Add 6 hours")
    );
    if (btn) btn.click();
  });

  console.log("✔ Bot hizo clic en '+ Add 6 hours'");
  console.log("⌛ Esperando 5 segundos para que aparezca Cloudflare...");
  await sleep(5000);

  // Buscar el iframe de Turnstile
  console.log("🔍 Buscando iframe del captcha...");

  const frames = page.frames();
  let captchaFrame = null;

  for (const frame of frames) {
    if (frame.url().includes("challenges.cloudflare.com")) {
      captchaFrame = frame;
      break;
    }
  }

  if (!captchaFrame) {
    console.log("❌ No se encontró iframe del captcha.");
  } else {
    console.log("✔ Captcha encontrado. Intentando clic...");

    try {
      // Selector del checkbox de Turnstile
      await captchaFrame.waitForSelector("input[type='checkbox']", { timeout: 20000 });

      await captchaFrame.click("input[type='checkbox']");
      console.log("✔ Clic en captcha realizado");

      console.log("⌛ Esperando verificación...");
      await sleep(15000);
    } catch (err) {
      console.log("❌ Error al intentar resolver captcha:", err);
    }
  }

  console.log("🔍 Verificando si aumentaron las horas...");

  const text = await page.evaluate(() => document.body.innerText);

  console.log("\n📌 Estado actual:");
  console.log(text);

  await browser.close();
}

runBot();
