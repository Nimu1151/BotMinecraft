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

  // Navegar la página entera buscando el botón
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(2000);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await sleep(2000);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 1.5));
  await sleep(2000);

  // Esperar el botón en el DOM
  await page.waitForSelector("span.Button___StyledSpan-sc-1qu1gou-2", {
    timeout: 60000
  });

  // Buscar el botón exacto + Add 6 hours
  const buttonPosition = await page.evaluate(() => {
    const spans = [...document.querySelectorAll("span.Button___StyledSpan-sc-1qu1gou-2")];
    const target = spans.find(s => s.textContent.includes("+ Add 6 hours"));
    if (!target) return null;

    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });

  if (!buttonPosition) {
    console.log("❌ No se encontró el botón '+ Add 6 hours'.");
    await browser.close();
    return;
  }

  // Scroll hacia el botón
  await page.evaluate(() => {
    const spans = [...document.querySelectorAll("span.Button___StyledSpan-sc-1qu1gou-2")];
    const target = spans.find(s => s.textContent.includes("+ Add 6 hours"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  await sleep(2000);

  console.log("✔ Bot encontró el botón y hará clic...");
  await page.mouse.click(buttonPosition.x, buttonPosition.y);

  console.log("⌛ Esperando 15 segundos para que aparezca Cloudflare...");
  await sleep(15000);

  console.log("🔍 Buscando iframe del captcha...");
  let captchaFrame = null;

  for (const frame of page.frames()) {
    if (frame.url().includes("challenges.cloudflare.com")) {
      captchaFrame = frame;
      break;
    }
  }

  if (!captchaFrame) {
    console.log("❌ No se encontró el iframe del captcha.");
  } else {
    console.log("✔ Captcha encontrado. Preparando clic...");

    // Captura antes de intentar el clic
    await page.screenshot({ path: "captcha.png" });
    console.log("📸 Captura guardada como captcha.png");

    console.log("⌛ Esperando 15 segundos antes de intentar clic...");
    await sleep(15000);

    try {
      await captchaFrame.waitForSelector("input[type='checkbox']", { timeout: 5000 });
      await captchaFrame.click("input[type='checkbox']");
      console.log("✔ Clic en captcha realizado.");
    } catch {
      console.log("❌ No hay checkbox visible. Cloudflare está usando Managed Challenge.");
      console.log("⌛ Esperando validación silenciosa...");
      await sleep(15000);
    }
  }

  // Revisar si aumentaron las horas
  console.log("🔍 Verificando si aumentaron las horas...");

  const text = await page.evaluate(() => document.body.innerText);
  console.log("\n📌 Estado actual:\n" + text);

  await browser.close();
}

runBot();
