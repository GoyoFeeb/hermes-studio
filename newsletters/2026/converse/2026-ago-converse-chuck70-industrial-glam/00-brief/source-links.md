# Source Links: Converse — 2026-ago-converse-chuck70-industrial-glam

> Verificado el 2026-08-21. Estado: [REFERENCIA OFICIAL LOCALIZADA — pendiente de aprobación cliente] salvo indicación.

## Fuentes oficiales

| URL | Qué aporta | Estado |
|---|---|---|
| https://www.converse.com/es/products/todos/iconos/chuck-70 | Categoría Chuck 70 ES — 113 resultados; subtítulo "Estilo premium de inspiración vintage. Actualizaciones de comodidad modernas."; línea "Solo son zapatillas. Hasta que tú las llevas." | ✅ OK (navegador) — curl bloqueado por Akamai |
| https://www.converse.com/es/shop/p/chuck-70-industrial-glam-unisex/A18326C.html | PDP Industrial Glam ES — 120 €, colorways, detalles de construcción, tallas, copy oficial, stock | ✅ OK (web_extract + navegador) |
| https://www.converse.com/es/shop/p/chuck-70-industrial-glam-unisex/A18325MP.html | Variante Black/Egret/Dark Matter (mismo modelo, otro colorway) | ✅ OK (enlace del selector de color en PDP) |
| https://www.converse.com/shop/p/chuck-70-canvas-unisex-low-top-shoe/A18158F.html | PDP US Chuck 70 Canvas — story oficial "In the early '70s, the Chuck Taylor got a makeover..." (usada para el origen) | ✅ OK (navegador) — solo US, no ES |
| https://www.converse.com/uk/en/landing-converse-history | Cronología oficial de marca — **2013 "THROWBACK, LOOK FORWARD": "Converse launches the Chuck 70, built off of the 1970s Chuck Taylor All Star design"**; 1917 origen del All Star; 1971 cinco colores | ✅ OK (web_extract) |
| https://www.converse.com/es | Home ES — campaña Evergreen BTS "TÚ > TODO LO DEMÁS — Empieza de cero con unas Chuck nuevas." | ✅ OK (navegador) |
| https://commons.wikimedia.org/wiki/File:Converse_logo.svg | Wordmark oficial Converse (logo vigente desde 2017) — negro, transparente, PD-textlogo, 1000×672 | ✅ OK — SVG directo 200 OK (`upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg`) |

## Assets (CDN de imágenes — bloqueo documentado)

| Asset | URL base | Estado |
|---|---|---|
| Foto hero Industrial Glam (a_107) | `https://www.converse.com/dw/image/v2/BJJF_PRD/on/demandware.static/-/Sites-cnv-master-catalog-we/default/dwe7cb02cc/images/a_107/A18326C_A_107X1.jpg?sw=964&strip=false` | ⚠️ 403 a curl (Akamai) — válida en navegador; descargar vía browser en build |
| Foto lateral (a_08) | `https://www.converse.com/dw/image/v2/BJJF_PRD/on/demandware.static/-/Sites-cnv-master-catalog-we/default/dw57da4f0e/images/a_08/A18326C_A_08X1.jpg?sw=406&strip=false` | ⚠️ 403 a curl — válida en navegador |
| Foto detalle/top (e_08) | `https://www.converse.com/dw/image/v2/BJJF_PRD/on/demandware.static/-/Sites-cnv-master-catalog-we/default/dwb4a5451b/images/e_08/A18326C_E_08X1.jpg?sw=406&strip=false` | ⚠️ 403 a curl — válida en navegador |
| Foto ángulo (d_08) | `https://www.converse.com/dw/image/v2/BJJF_PRD/on/demandware.static/-/Sites-cnv-master-catalog-we/default/dw9d35ba1f/images/d_08/A18326C_D_08X1.jpg?sw=406&strip=false` | ⚠️ 403 a curl — válida en navegador |
| Foto variante Black (a_107 white) | `https://www.converse.com/dw/image/v2/BJJF_PRD/on/demandware.static/-/Sites-cnv-master-catalog-we/default/dw4d58af5f/images/a_107_white/A18325C_A_107X1_White.jpg?sw=71` | ⚠️ 403 a curl — válida en navegador |

> **Hallazgo técnico (para fase 07):** el CDN de Converse (Akamai) devuelve 403 a curl incluso con Referer+UA+sec-ch. Las URLs funcionan en navegador (probado en PDP renderizado). El build debe descargar las imágenes vía navegador (browser_navigate → asset) o el flujo interno `generate-hero-image`, y subirlas a CDN propio (PENDING-CDN-UPLOAD) o embekerlas en base64. **No** marcar estas URLs como rotas por el 403 de curl.

## Fuentes descartadas / no usadas

| URL | Motivo |
|---|---|
| https://www.converse.com/es/shop/p/chuck-70-canvas-unisex-low-top-shoe/A18158C.html | 404 — el colorway Armor Blue (US) no existe en ES |
| https://www.converse.com/es/shop/p/converse-chuck-70-x-dragon-ball-z-shenron-unisex/A21841C.html | Collab DBZ — 100 €, casi agotada (solo EU 40); fuera de la pieza (la pieza es Industrial Glam) |
| https://www.converse.com/es/shop/chuck-70-shoes (y variantes) | 404 en ES — la ruta de categoría real es `/es/products/todos/iconos/chuck-70` |
| https://en.wikipedia.org/wiki/Converse_Chuck_Taylor_All_Stars | No existe el artículo con ese título exacto — usar la cronología oficial de Converse como fuente de historia |
| https://www.converse.com/es/shop/p/chuck-70-industrial-glam-unisex/A18326MP.html | Variante MP no localizada; usar A18326C (color Egret) + A18325MP (color Black) |
