/**
 * thumbnail.ts — miniatura de una newsletter para el historial de Studio (2026-09-28).
 *
 * La genera el worker en el Mac, no Railway: el servicio está en plan de prueba con poca memoria y
 * abrir Chromium allí por cada miniatura podía tumbarlo. El worker ya usa Playwright para medir el móvil.
 *
 * Se renderiza a 800 px de ancho (por encima de las media queries de móvil, ~620 px) y se recorta la
 * parte de arriba de la pieza (600 × 800 centrados), que es lo que la identifica: logo, hero y titular.
 * La miniatura sale a 600 × 800 (2026-10-13; antes 300 × 400): el abanico de la portada la enseña a unos
 * 305 px de ancho al señalarla, el doble en pantalla retina, y a 300 se veía pixelada. Se captura al doble
 * de densidad y se reduce, para que el texto pequeño quede limpio.
 * Sin JavaScript: el HTML lo escribe un modelo que ha leído webs de terceros.
 */
import { launchBrowser } from './renderChecks';
import sharp from 'sharp';

const VIEWPORT = { width: 800, height: 800 };
const CLIP = { x: 100, y: 0, width: 600, height: 800 };
export const THUMB_SIZE = { width: 600, height: 800 };

/** Devuelve la miniatura como JPEG en base64, o null si no se pudo renderizar (no bloquea nada).
 *  Un intento más antes de rendirse: en la prueba del 2026-09-28 una de cinco falló al abrir Chromium
 *  justo después de cerrarse otro, y a la segunda salió bien. Sin reintento quedaba marcada para siempre. */
export async function renderThumbnail(source: { path?: string; html?: string }): Promise<string | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    let browser;
    try {
      browser = await launchBrowser();
      const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2, javaScriptEnabled: false });
      if (source.path) await page.goto(`file://${source.path}`, { waitUntil: 'load', timeout: 30000 });
      else await page.setContent(source.html || '', { waitUntil: 'load', timeout: 30000 });
      const png = await page.screenshot({ type: 'png', clip: CLIP });
      const jpeg = await sharp(png).resize(THUMB_SIZE.width, THUMB_SIZE.height).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      return jpeg.toString('base64');
    } catch (err) {
      console.log(`Miniatura: intento ${attempt} fallido — ${(err as Error).message.split('\n')[0].slice(0, 200)}`);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    } finally {
      await browser?.close().catch(() => undefined);
    }
  }
  return null;
}
