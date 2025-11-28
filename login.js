const puppeteer = require("puppeteer");
const fs = require("fs");

async function saveCookies() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  // Ir al login
  await page.goto("https://panel.freegamehost.xyz/auth/login", {
    waitUntil: "networkidle2"
  });

  console.log("Inicia sesión manualmente…");

  // Esperar a que entres al dashboard
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  // Guardar cookies
  const cookies = await page.cookies();
  fs.writeFileSync("cookies.json", JSON.stringify(cookies));

  console.log("✔ Cookies guardadas correctamente.");
  await browser.close();
}

saveCookies();
