/**
 * catalog.ts — índice del catálogo de módulos y guía de patrones para el brief y el encargo (2026-10-06, opción 3, fase B).
 *
 * El HTML de cada módulo lo genera `build-catalog.ts` con el motor en `studio/hermes/modulos/<id>.html`. Aquí vive lo que
 * necesitan el servidor (brief) y el worker (encargo) sin cargar Playwright ni el motor: qué es cada módulo, cuándo
 * usarlo, la guía de los 3 patrones (antes 60 KB en `patterns/*.md`, condensados) y qué módulos eligió un brief.
 */
import * as fs from 'fs';
import * as path from 'path';

/** Qué es cada módulo y cuándo usarlo (de engine/components/INVENTORY.md y patterns/*.md, condensado). */
export const MODULES: Record<string, { grupo: string; que: string; cuando: string }> = {
  'header-logo': { grupo: 'Cabecera', que: 'Logo centrado sobre fondo de marca, con etiqueta opcional.', cuando: 'Casi siempre arriba; separado del hero.' },
  'hero-imagen': { grupo: 'Hero', que: 'Foto grande a todo el ancho + titular, subtítulo y CTA en texto vivo.', cuando: 'Producto o marca con fotografía fuerte (patrón fotografía primero).' },
  'hero-centrado': { grupo: 'Hero', que: 'Titular y subtítulo centrados sobre color de marca, sin foto, + CTA.', cuando: 'Mensaje institucional o de servicio sin foto protagonista.' },
  'hero-asimetrico': { grupo: 'Hero', que: 'Titular a la izquierda y una cifra grande a la derecha (dato de ahorro, precio), + CTA.', cuando: 'Ofertas con una cifra verificada que es el gancho (patrón oferta y precio).' },
  'intro-cta': { grupo: 'Texto', que: 'Bloque de título + párrafo + CTA secundario.', cuando: 'Introducir el mensaje tras el hero o abrir una sección.' },
  'intro-cta-asimetrico': { grupo: 'Texto', que: 'Título y párrafo a la izquierda (64 %), CTA a la derecha (36 %) en la misma fila.', cuando: 'Igual que intro-cta, con un ritmo menos centrado.' },
  'editorial-foto-texto': { grupo: 'Foto + texto', que: 'Foto a un lado y texto con CTA al otro, en dos columnas (se apila en móvil).', cuando: 'Hay una segunda foto real y útil (producto en uso, detalle) distinta del hero.' },
  'editorial-foto-texto-inverso': { grupo: 'Foto + texto', que: 'Como editorial-foto-texto con la foto al otro lado.', cuando: 'Alternar con editorial-foto-texto para no repetir composición.' },
  'columns-3-beneficios': { grupo: 'Listas', que: '2-4 beneficios en columnas con icono, título y texto; destacado de sección opcional.', cuando: 'Ventajas paralelas del producto o servicio (con iconos de la marca).' },
  'columns-3-beneficios-sin-icono': { grupo: 'Listas', que: '2-4 beneficios en columnas solo con título y texto.', cuando: 'Marcas que no usan iconos ni emoji (premium, fotografía).' },
  'columns-3-beneficios-asimetrico': { grupo: 'Listas', que: 'Beneficios en filas apiladas: icono en halo a la izquierda y texto a la derecha.', cuando: 'Beneficios con más texto, o para romper una fila de columnas anterior.' },
  'lista-premium': { grupo: 'Listas', que: '3-4 tarjetas apiladas con icono en insignia, título y texto.', cuando: 'Características sin orden entre sí (materiales, tecnología, garantía).' },
  'lista-premium-2col': { grupo: 'Listas', que: 'Las tarjetas de lista-premium en rejilla de 2 columnas.', cuando: 'Igual que lista-premium con menos altura.' },
  'pasos': { grupo: 'Proceso', que: '2-4 pasos numerados en fila (círculos con número + título + texto).', cuando: 'Un proceso real y ordenado: cómo comprar, cómo funciona, cómo reservar.' },
  'pasos-vertical': { grupo: 'Proceso', que: 'Los pasos apilados con una línea que conecta los círculos.', cuando: 'Igual que pasos, con textos más largos o en móvil.' },
  'metric-strip-premium': { grupo: 'Datos', que: 'Franja de 2-4 cifras grandes con su etiqueta.', cuando: 'Cifras técnicas o de marca verificadas (autonomía, años, peso…).' },
  'card-tarifa': { grupo: 'Ofertas', que: 'Rejilla 2×2 de tarjetas con icono, título, texto y enlace.', cuando: 'Comparar 4 opciones, tarifas o productos.' },
  'card-tarifa-3': { grupo: 'Ofertas', que: 'La rejilla de tarjetas con exactamente 3.', cuando: 'Tres opciones o planes.' },
  'category-grid': { grupo: 'Catálogo', que: 'Rejilla de 2-8 categorías (3 por fila) con emoji o icono, título y CTA.', cuando: 'Un catálogo real de líneas o categorías de producto.' },
  'category-grid-img': { grupo: 'Catálogo', que: 'La rejilla de categorías con icono en imagen real.', cuando: 'Marcas con iconos propios.' },
  'usp-cards': { grupo: 'Diferenciales', que: 'Sección con antetítulo, título, texto e insignia + 2-4 tarjetas de diferencial con icono.', cuando: 'Por qué elegir la marca: sus razones con respaldo.' },
  'usp-cards-sin-icono': { grupo: 'Diferenciales', que: 'Las tarjetas de diferencial solo con texto.', cuando: 'Marcas sin iconos.' },
  'usp-cards-asimetrico': { grupo: 'Diferenciales', que: 'Antetítulo, título con insignia al lado, cuerpo a todo el ancho y tarjetas debajo.', cuando: 'Igual que usp-cards con más jerarquía.' },
  'usp-cards-sin-icono-asimetrico': { grupo: 'Diferenciales', que: 'La versión asimétrica sin iconos.', cuando: 'Marcas sin iconos que quieren la versión asimétrica.' },
  'trust-bar': { grupo: 'Confianza', que: '3 avales en píldoras con check (envío, garantía, atención…).', cuando: 'Tres avales VERIFICADOS; nunca inventados.' },
  'trust-bar-inline': { grupo: 'Confianza', que: 'Los 3 avales en una línea separados por puntos, sin píldoras.', cuando: 'La versión discreta o editorial.' },
  'banda-cierre': { grupo: 'Cierre', que: 'Banda de color oscuro de la marca con título, texto y CTA principal centrados.', cuando: 'El cierre: repite el CTA principal.' },
  'banda-cierre-asimetrico': { grupo: 'Cierre', que: 'Banda de cierre con texto a todo el ancho y el CTA alineado a la izquierda.', cuando: 'Cierre con ritmo menos centrado.' },
  footer: { grupo: 'Pie', que: 'Pie con marca, lema, aviso legal, baja y preferencias.', cuando: 'Siempre al final (la base técnica ya trae uno: elige uno de los dos).' },
};


/** Una línea por módulo para el brief: `id` — qué es. */
export function catalogIndex(): string[] {
  return Object.entries(MODULES).map(([id, m]) => `  · \`${id}\` (${m.grupo.toLowerCase()}): ${m.que}`);
}

/** Los 3 patrones del motor (patterns/*.md), condensados en lo que decide la estructura de una pieza. */
export const PATTERNS_GUIDE = [
  '## Estructura: elige un patrón según la pieza (y dilo en la sección 1)',
  '- Oferta y precio: hay una cifra o un precio VERIFICADO que es el gancho → `hero-asimetrico` (la cifra) o',
  '  `hero-imagen` · `trust-bar` (3 avales verificados) · `card-tarifa`/`card-tarifa-3` (opciones) · `pasos` (cómo',
  '  conseguirlo) · `lista-premium` · `banda-cierre`.',
  '- Institucional: marca o servicio sin cifra protagonista → `header-logo` · `hero-centrado` o `hero-imagen` ·',
  '  `intro-cta` · `columns-3-beneficios` · `category-grid` (solo con un catálogo real) · `usp-cards` (por qué la',
  '  marca) · `banda-cierre`.',
  '- Fotografía primero: producto con fotos oficiales fuertes → `header-logo` · `hero-imagen` ·',
  '  `editorial-foto-texto`/`-inverso` (solo con una segunda foto real y distinta) · `metric-strip-premium` (cifras',
  '  verificadas) · `columns-3-beneficios-sin-icono` · `pasos` (un proceso real) · `lista-premium` (características',
  '  sin orden) · `banda-cierre`.',
  '- Ritmo: dos secciones seguidas nunca con el mismo fondo, alineación y densidad. El CTA principal, arriba y en el',
  '  cierre (no más de dos veces). Sin relleno: si no hay segunda foto, proceso real ni características, no añadas',
  '  módulo; una pieza corta es mejor. Al menos un módulo propio del concepto (del catálogo adaptado o nuevo).',
];

/** Ids del catálogo que el brief nombra (entre comillas invertidas o, si llevan guion, tal cual), en orden. */
export function chosenModules(text: string, max = 6): string[] {
  const found: { id: string; at: number }[] = [];
  for (const id of Object.keys(MODULES)) {
    const re = id.includes('-') ? new RegExp(`(?<![a-z0-9-])${id}(?![a-z0-9-])`, 'i') : new RegExp(`\`${id}\``, 'i');
    const m = text.match(re);
    if (m) found.push({ id, at: m.index || 0 });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.id).slice(0, max);
}

/** HTML de los módulos elegidos, para pegarlo en el encargo. */
export function chosenModulesNote(text: string, root: string): string {
  const ids = chosenModules(text);
  const parts = ids.flatMap((id) => {
    try {
      return [`### Módulo \`${id}\` (studio/hermes/modulos/${id}.html)`, '```html', fs.readFileSync(path.join(root, 'studio', 'hermes', 'modulos', `${id}.html`), 'utf8').trim(), '```'];
    } catch {
      return [];
    }
  });
  if (!parts.length) return '';
  return [
    '',
    '## Módulos del catálogo que eligió el brief (HTML de email probado; contenido completo, no los leas del disco)',
    'Reutiliza su ESTRUCTURA (tablas, clases, VML de los botones) dentro de la base técnica. Están renderizados con el',
    'brand pack de otra marca: cambia textos, imágenes, colores y tipografía por los de esta marca y este brief.',
    ...parts,
  ].join('\n');
}
