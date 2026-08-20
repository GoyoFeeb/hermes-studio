# Assets Notes: Mercedes-AMG — C 63 S E PERFORMANCE

## Resumen de assets

| # | Asset | Módulo | Tipo | Tamaño desktop | Disponible | Prioridad |
|---|---|---|---|---|---|---|
| 1 | Logo Mercedes-AMG (raster) | 1 Header | Logo | 150×35 px | ✅ local | Crítica |
| 2 | Hero — sedán nocturno | 2 Hero | Foto producto | 600×338 px | ✅ CDN oficial | Crítica |
| 3 | Tren motriz híbrido | 3 Editorial | Foto producto | 254×190 px | ✅ CDN oficial | Alta |
| 4 | Batería alto rendimiento | 4 Editorial | Foto producto | 254×190 px | ✅ CDN oficial | Alta |

Todas las imágenes del CDN son del dominio oficial de la marca (imgix). **Nada se genera con
IA** (photography.usesRealPhotography: true — el pack documenta que la campaña usa fotografía
real del CDN de la marca).

---

### Asset 1 — Logo Mercedes-AMG

**Módulo:** 1 (Header)
**Tipo:** Logo
**Prioridad:** Crítica

**Especificaciones desktop:**
- Ancho: 150px | Alto: 35px | Formato: PNG (raster del lockup oficial; el SVG oficial no
  renderiza en Gmail/Outlook clásico — R-08)
- Alt text: «Mercedes-AMG» (uso 1 de 3 del nombre de marca)
- Enlace: none (masthead decorativo) — o página modelo ES si el agente 05 decide vincularlo
  (no recomendado: gastaría un uso de marca en el alt y el header)

**Disponibilidad:**
- Estado: ✅ local
- Ruta: `brands/mercedes-amg/design-input/logo-mercedes-amg-white-588.png` (588×138 nativo,
  densidad 600; ratio 4.26 = 150×35)
- Alternativa: `design-input/logo-mercedes-amg-official.svg` (solo para clientes modernos)

---

### Asset 2 — Hero (apertura)

**Módulo:** 2 (Hero)
**Tipo:** Foto producto (banner)
**Prioridad:** Crítica

**Especificaciones desktop:**
- Ancho: 600px | Alto: 338px | Formato: JPG (email-safe vía `?fm=jpg`)
- Alt text: «Sedán deportivo híbrido sobre asfalto nocturno» (SIN marca — presupuesto)
- Enlace: none (la acción del hero es su CTA)

**URL (CDN oficial de la marca, imgix — verificada HTTP 200 + image/jpeg el 2026-08-20):**
`https://www.mercedes-amg.com/media/images/21dfb48ef6fbbece446b2dfa183b6af940dba924-1440x810.jpg?fm=jpg&w=1200`
- Fuente nativa 1440×810 (16:9); se sirve a w=1200 (2× de 600 para retina). ⚠️ Mantener
  `?fm=jpg` (con auto=format el CDN negocia webp — R-07).

**Disponibilidad:**
- Estado: ✅ CDN oficial (200, image/jpeg, 149 KB a w=1200)

---

### Asset 3 — Tren motriz híbrido

**Módulo:** 3 (Editorial foto-texto)
**Tipo:** Foto producto (detalle técnico)
**Prioridad:** Alta

**Especificaciones desktop:**
- Ancho: 254px (columna 46%) | Alto: 190px (recorte 4:3) | Formato: JPG
- Alt text: «Detalle del tren motriz híbrido» (SIN marca)
- Enlace: none (el CTA del módulo es la acción)

**URL (CDN oficial, imgix — verificada 200 + image/jpeg el 2026-08-20):**
`https://www.mercedes-amg.com/media/images/d3ff0fcc72190d9fd736095c52fbeaa786e49c5d-1440x1440.jpg?fm=jpg&w=560&h=420&fit=crop`
- Fuente nativa 1440×1440 (cuadrada, R-12): se sirve a 560×420 (4:3, 2× de 254×190). ⚠️ El
  `fit=crop` centra el recorte: verificar en QA visual que no corta el sujeto. Alternativa si el
  crop daña: `?fm=jpg&w=700` sin crop presentada a 254px de ancho con altura 254 (cuadrado) o en
  fila propia a 600px.

**Disponibilidad:**
- Estado: ✅ CDN oficial (200, image/jpeg, 98 KB a w=700)

---

### Asset 4 — Batería de alto rendimiento

**Módulo:** 4 (Editorial foto-texto-inverso)
**Tipo:** Foto producto (detalle técnico)
**Prioridad:** Alta

**Especificaciones desktop:**
- Ancho: 254px (columna 46%) | Alto: 190px (recorte 4:3) | Formato: JPG
- Alt text: «Batería de alto rendimiento» (SIN marca)
- Enlace: none

**URL (CDN oficial, imgix — verificada 200 + image/jpeg el 2026-08-20):**
`https://www.mercedes-amg.com/media/images/9be0cde698a14c7ee2039dfec4b8391d98ff6c54-1440x1440.jpg?fm=jpg&w=560&h=420&fit=crop`
- Misma nota de recorte 4:3 que el asset 3.

**Disponibilidad:**
- Estado: ✅ CDN oficial (200, image/jpeg, 81 KB a w=700)

---

## Enlaces (CTAs)

| CTA | URL | Verificado |
|---|---|---|
| Descubrir (hero) | https://www.mercedes-benz.es/passengercars/models/saloon/c-class/amg.html | 200 |
| Sentir / La batería (editorial) | https://www.mercedes-amg.com/en/c-class-sedan | 200 |
| Configurar (cierre) | http://amg4.me/configure_c63se_sedan | 200 sin redirect |

UTM (convención del pack): `utm_source=newsletter&utm_medium=email&utm_campaign=c63-se-performance&utm_content={modulo}-cta`
→ hero-cta, editorial1-cta, editorial2-cta, closing-cta.

## Pendientes

- Q-005: línea legal WLTP en español para el footer (texto oficial ES; placeholder de prueba
  mientras tanto).
- Decisión de contraste del eyebrow rojo sobre blanco (R-11): ver desktop-spec módulo 3 — el
  agente 05/08 fijará rojo puro (3.11:1, falla AA a 11px) vs derivado oscuro #8F1418 (6.14:1).
