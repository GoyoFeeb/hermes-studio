# Requirements: Converse — 2026-ago-converse-chuck70-industrial-glam

## Requisitos legales

| Requisito | Estado | Nota |
|---|---|---|
| Footer con datos legales reales de la marca | [PENDIENTE] | Usar enlaces reales del footer ES: Estado del pedido (`/es/order-status`), Buscar una Tienda (`/es/customer-service`), Privacidad y condiciones (`/es/customer-service?cid=...`), Política de Privacidad y Cookies. Confirmar legalLine final con cliente |
| © 2026 Converse | ✅ VERIFICADO | Observado en footer de converse.com/es el 2026-08-21 |
| Logo con marca registrada | ✅ OK | El wordmark Converse incluye ® (SVG oficial de Wikimedia, PD-textlogo); la pieza ES comunicación de la marca — no requiere disclaimer de terceros |
| Derechos del logo | ✅ OK | PD-textlogo (umbral de originalidad no alcanzado) — uso permitido; la pieza representa a la propia marca |
| Datos de contacto / unsubscribe | [PENDIENTE] | El sistema de newsletter del cliente (ESP) proveerá unsubscribeUrl/preferencesUrl — confirmar en exportación |
| Derechos de imagen de producto | [PENDIENTE] | Imágenes de producto del CDN oficial de Converse (ficha A18326C) — revalidar que se permite hotlink en email; alternativa: descargar vía navegador y subir a CDN propio (PENDING-CDN-UPLOAD) |

## Requisitos comerciales

| Requisito | Estado | Nota |
|---|---|---|
| Precio | ✅ VERIFICADO | 120,00 € (ficha ES A18326C, 2026-08-21) — revalidar a 48 h del envío |
| Tallas disponibles | ✅ VERIFICADO | EU 35–45 sin agotados el 2026-08-21 — revalidar stock antes de envío real |
| Ajuste ("queda grande, media talla menos") | ✅ VERIFICADO | Ficha ES — usar como dato útil si entra en copy |
| Sin claims de urgencia/exclusividad | ✅ CUMPLE | "Edición limitada" solo verificado para DBZ (fuera de pieza); no afirmar limitación de Industrial Glam |
| Sin "gratis"/"garantizado"/"líder" | ✅ CUMPLE | Ninguno verificado — no aparecen |
| Línea de campaña oficial "Solo son zapatillas. Hasta que tú las llevas." | [PENDIENTE OK MARCA] | Es copy oficial de Converse (categoría Chuck 70) — usar requiere confirmación |
| CTA final de compra | ✅ VERIFICADO | PDP con "Añadir al carro" activo (stock real) — verbo de compra legítimo |

## Requisitos técnicos

| Requisito | Estado | Nota |
|---|---|---|
| Motor: `engine/build-newsletter.js` | ✅ | Patrón `fotografia-primero` |
| Brand pack nuevo | [PENDIENTE] | Crear `brands/converse/tokens/brand-tokens.json` (fase 02) |
| Imágenes | [PENDIENTE] | CDN oficial bloquea curl (403 Akamai) — descargar vía navegador en build; usar `{{token}}`/PENDING-CDN-UPLOAP hasta CDN propio |
| Logo | ✅ URL localizada | Wikimedia SVG 200 OK; convertir a PNG en build |
| Email compatible | ✅ | Tablas, inline, VML para Outlook, sin JS, 600px centrado (NORMA) |
| Contraste WCAG AA | [PENDIENTE] | Calcular en fase 04 con colores reales del pack |
| Nombre de producto ≤3 veces | ✅ | "Chuck 70" ×2 planificado (asunto + escena 2) |
| Nombre de marca ≤3 veces | ✅ | Logo alt (1), URL (2), © 2026 Converse (3) |
| Números siempre con verbo | ✅ | "Cuestan 120 €", "tallas de la 35 a la 45" |
| CTAs distintos (descubrir → aprender → comprar) | ✅ | "Descubrir la edición" / "Ver los detalles" / "Hacerlas tuyas" |
