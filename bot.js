const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

puppeteer.use(StealthPlugin());

// ============= CONFIGURACIÓN =============
const CONFIG = {
  serverUrl: "https://panel.freegamehost.xyz/server/0bfe8b47",
  cookiesFile: "cookies.json",
  timeout: 90000, // 90 segundos
  isGitHubActions: process.env.GITHUB_ACTIONS === 'true'
};

// ============= UTILIDADES =============

function log(emoji, mensaje) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${emoji} ${mensaje}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============= RESOLVER CLOUDFLARE =============

async function resolverCloudflare(page, maxIntentos = 5) {
  log("🔍", "Verificando desafío de Cloudflare...");
  
  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      log("⏳", `Intento ${intento}/${maxIntentos}`);
      await sleep(3000);
      
      // Verificar si ya no hay desafío
      const hayDesafio = await page.evaluate(() => {
        const texto = document.body.innerText.toLowerCase();
        return texto.includes('verificando') || 
               texto.includes('checking') || 
               texto.includes('verifying') ||
               texto.includes('please wait');
      });
      
      if (!hayDesafio) {
        log("✅", "No hay desafío activo");
        return true;
      }
      
      // Buscar frames de Cloudflare
      const frames = page.frames();
      log("📄", `Analizando ${frames.length} frames`);
      
      for (const frame of frames) {
        const url = frame.url();
        
        if (url.includes('cloudflare') || 
            url.includes('challenges') || 
            url.includes('turnstile')) {
          
          log("🎯", "Frame de Cloudflare encontrado");
          
          // Selectores posibles
          const selectores = [
            'input[type="checkbox"]',
            '.cb-i',
            'label',
            '.ctp-checkbox-label',
            '[role="checkbox"]'
          ];
          
          for (const selector of selectores) {
            try {
              await frame.waitForSelector(selector, { timeout: 3000 });
              await frame.click(selector);
              log("🖱️", `Clic exitoso en: ${selector}`);
              await sleep(5000);
              return true;
            } catch (e) {
              // Probar siguiente selector
            }
          }
        }
      }
      
      // Esperar más tiempo por si se resuelve solo
      await sleep(3000);
      
    } catch (error) {
      log("⚠️", `Error en intento ${intento}: ${error.message}`);
    }
  }
  
  log("⚠️", "No se pudo resolver automáticamente");
  return false;
}

// ============= HACER CLIC EN BOTÓN =============

async function clickBotonExtender(page) {
  log("🔍", "Buscando botón 'Add 6 hours'");
  
  try {
    await sleep(2000);
    
    // Método 1: Buscar por texto exacto
    const resultado = await page.evaluate(() => {
      const elementos = Array.from(document.querySelectorAll('span, button, a'));
      
      for (const el of elementos) {
        const texto = (el.textContent || '').trim();
        
        if (texto.includes('Add 6 hours') || 
            texto.includes('Add 6') ||
            texto.includes('+ Add 6')) {
          
          // Buscar botón padre
          let boton = el;
          let intentos = 0;
          while (boton && boton.tagName !== 'BUTTON' && intentos < 10) {
            boton = boton.parentElement;
            intentos++;
            if (!boton || boton.tagName === 'BODY') break;
          }
          
          if (boton && boton.tagName === 'BUTTON') {
            boton.click();
            return { exito: true, texto: texto, metodo: 'botón padre' };
          }
          
          // Intentar clic directo
          el.click();
          return { exito: true, texto: texto, metodo: 'elemento directo' };
        }
      }
      
      return { exito: false };
    });
    
    if (resultado.exito) {
      log("✅", `Botón clickeado: "${resultado.texto}" (${resultado.metodo})`);
      await sleep(3000);
      
      // Resolver el nuevo Cloudflare
      log("🔄", "Resolviendo verificación post-clic");
      await resolverCloudflare(page, 3);
      
      return true;
    }
    
    // Método 2: Por clase CSS específica
    const selector = 'span.Button___StyledSpan-sc-1qu1gou-2';
    const existe = await page.$(selector);
    
    if (existe) {
      await page.click(selector);
      log("✅", "Botón clickeado por selector CSS");
      await sleep(3000);
      await resolverCloudflare(page, 3);
      return true;
    }
    
    log("❌", "Botón no encontrado");
    return false;
    
  } catch (error) {
    log("❌", `Error al hacer clic: ${error.message}`);
    return false;
  }
}

// ============= FUNCIÓN PRINCIPAL =============

async function main() {
  log("🚀", "Iniciando FreeGameHost Bot");
  log("ℹ️", `Entorno: ${CONFIG.isGitHubActions ? 'GitHub Actions' : 'Local'}`);
  
  // Verificar cookies
  if (!fs.existsSync(CONFIG.cookiesFile)) {
    log("❌", "Archivo cookies.json no encontrado");
    process.exit(1);
  }
  
  let browser;
  
  try {
    // Configuración del navegador
    const browserArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920,1080"
    ];
    
    log("🌐", "Lanzando navegador");
    browser = await puppeteer.launch({
      headless: "new",
      args: browserArgs,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
    
    const page = await browser.newPage();
    
    // Configurar página
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Cargar cookies
    log("🍪", "Cargando cookies");
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookiesFile, "utf-8"));
    await page.setCookie(...cookies);
    log("✅", `${cookies.length} cookies cargadas`);
    
    // Navegar al servidor
    log("🌐", `Navegando a: ${CONFIG.serverUrl}`);
    await page.goto(CONFIG.serverUrl, {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout
    });
    
    log("✅", "Página cargada");
    
    // Resolver Cloudflare inicial
    await resolverCloudflare(page);
    await sleep(2000);
    
    // Hacer clic en el botón
    log("🎯", "Extendiendo tiempo del servidor");
    const exito = await clickBotonExtender(page);
    
    if (exito) {
      log("🎉", "¡ÉXITO! Tiempo extendido (+6 horas)");
      
      // Verificar resultado
      await sleep(3000);
      const titulo = await page.title();
      log("📄", `Título de página: ${titulo}`);
      
      process.exit(0);
    } else {
      log("❌", "No se pudo hacer clic en el botón");
      
      // Capturar HTML para debug
      const html = await page.content();
      const htmlPreview = html.substring(0, 500);
      log("🐛", `HTML preview: ${htmlPreview}...`);
      
      process.exit(1);
    }
    
  } catch (error) {
    log("❌", `Error fatal: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
    
  } finally {
    if (browser) {
      await browser.close();
      log("🔒", "Navegador cerrado");
    }
  }
}

// ============= MANEJO DE ERRORES =============

process.on('unhandledRejection', (error) => {
  log("❌", `Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log("❌", `Uncaught exception: ${error.message}`);
  process.exit(1);
});

// ============= EJECUCIÓN =============

main();
