# Risks — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 02 (Brand Visual Analyst). Fecha: 2026-08-20.

## Riesgos de datos / legal (bloquean producción, no el avance como prueba)

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R-01 | Precio España sin fuente oficial (Q-001): única cifra localizada = carwow.es 155.497 € (tercero) | ALTA | No incluir precio hasta confirmación oficial. Reintentar mercedes-benz.es (antibots) vía navegador manual o petición al cliente |
| R-02 | Disponibilidad comercial ES sin confirmar (Q-002) | ALTA | Copy sin plazos/urgencia/novedad. Verificar en la página oficial antes de cada envío |
| R-03 | Velocidad máxima 280 (página oficial actual) vs 250 ampliable (prensa 2022) (Q-003) | MEDIA | No incluir Vmax; resolver con cliente antes de producción |
| R-04 | Superlativo «cuatro cilindros de producción más potente del mundo» (afirmación literal de Mercedes) disparará el claims gate (HIGH) (Q-004) | MEDIA | Usar solo con aprobación legal + `_claimSources` documentado; si no, retirar (el concepto no depende de él) |
| R-05 | Línea legal WLTP en español para el footer (Q-005): solo existe la variante DE/EN en la página de producto | MEDIA | Footer con placeholder hasta texto oficial ES; productionReady:false hasta entonces |
| R-06 | El claims gate marcará cifras legítimas (potencia, 0 a 100, tracción integral, velocidad máxima, consumo) aunque estén verificadas | MEDIA | Reformulación en copy (agente 05): «energía/respuesta», «3,4 segundos hasta los 100 km/h», «AMG Performance 4MATIC+», sin «velocidad máxima», sin «consumo» en cuerpo |

## Riesgos técnicos / de render

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R-07 | CDN imgix negocia webp con `?auto=format` — un cliente que no soporta webp o el <img> con Content-Type webp puede fallar | MEDIA | Usar SIEMPRE `?fm=jpg` en todas las URLs de imagen (verificado: 200 image/jpeg) |
| R-08 | Logo SVG no renderiza en Gmail/Outlook clásico | MEDIA | Usar raster PNG del pack (design-input/logo-mercedes-amg-white-588.png); alt «Mercedes-AMG» como fallback |
| R-09 | `cta-secondary-bulletproof` tiene `arcsize="50%"` hardcodeado: en Outlook desktop el CTA secundario (editorial) saldría pastilla aunque el radio sea 0 | BAJA | QA Outlook (agente 08): verificar; si molesta, usar solo el CTA primario (block) en todas las escenas o documentar la deuda conocida |
| R-10 | `components.cta.style` no está declarado en el pack (v2.2.0); el CTA real es de esquina recta (radius 0) | BAJA | Activar `"style": "block"` para esta campaña (evidencia nueva v2.3.0) o confiar en radius.ctaPill 0 (visual equivalente salvo VML) |
| R-11 | Eyebrow rojo #B21E23 a 11px sobre negro = 3.11:1 (FALLA AA); sobre blanco también falla para texto pequeño | MEDIA | Eyebrows sobre fondos oscuros en blanco/gris #9F9F9F (onBrandSecondary); rojo solo sobre claro con tamaño/weight suficientes o como acento no textual |
| R-12 | Imágenes 1440×1440 (escenas 2-3) cuadradas en columna editorial 46% | BAJA | Recorte imgix (?fit=crop) a ratio de columna o presentación con altura fija ≤ 460px; verificar visualmente |
| R-13 | NORMA 600px: escenas con fondo propio centrado, nunca full-bleed | ALTA | Agente 04/07: tabla 600px centrada con bgcolor en la propia tabla; verificar Playwright 1280 (w=600, x=340, scrollWidth=1280) |
| R-14 | mercedes-benz.es con protección antibots (carga vacía en navegador automatizado) | BAJA | Extracción manual/petición cliente para precio y legal; el enlace de CTA ES es válido (200) |

## Riesgos de contenido

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R-15 | La prensa lamenta el V8 (Car and Driver) — riesgo de que la pieza lea como «apología de lo que se perdió» | MEDIA | El concepto «Antes del ruido, el impulso» evita la comparación: narra la ganancia (respuesta inmediata), no la pérdida. No afirmar el dato del V8 anterior (fuente prensa, no oficial) |
| R-16 | Presupuesto de marca ajustado: «C 63» = 3 usos, «Mercedes-AMG» = 3 (header alt + hero brandName + copyright) | MEDIA | Planificar los usos en el agente 05; CTAs sin nombre de marca; footer logo decorativo alt="" |
| R-17 | Dos bloques editoriales en espejo pueden leerse como «plantilla alternada» | BAJA | El patrón lo permite (máx. 3); espejo foto-izq/foto-der + fondos distintos (blanco / #F2F2F2 opcional) rompe la repetición. Verificar en QA |
