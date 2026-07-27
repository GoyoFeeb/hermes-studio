# Links QA — Rolex Datejust "Una fecha para recordar"

## Enlaces (contra `07-build/final.html`)

| Enlace | Módulo | Estado |
|---|---|---|
| `https://www.rolex.com/es/watches/datejust?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-rolex-datejust-verde&utm_content=hero` | hero-imagen (CTA) | ✅ https absoluto, UTM completo |
| `https://www.rolex.com/es/watches/datejust?...&utm_content=intro` | intro-cta-asimetrico (CTA) | ✅ https absoluto, UTM completo, `utm_content` distinto (intro) |
| `https://www.rolex.com/es/watches/datejust?...&utm_content=cierre` | banda-cierre-asimetrico (CTA) | ✅ https absoluto, UTM completo, `utm_content` distinto (cierre) |
| `[UNSUBSCRIBE_LINK]` | footer | ✅ Merge-tag ESP válido (patrón `espResolvedUrl` del schema) — no es un dato pendiente, es un token que resuelve el ESP en el envío |
| `[PREFERENCES_LINK]` | footer | ✅ Merge-tag ESP válido, mismo criterio |

Ningún `href` vacío ni `#`. Los 3 CTA de campaña comparten dominio y ruta (misma landing, `rolex.com/es/watches/datejust`) con solo `utm_content` variando — coherente con `03-strategy/message-hierarchy.md` (mismo destino en los 3 puntos de contacto).

## Imágenes

| Imagen | `src` | `alt` | Estado |
|---|---|---|---|
| Logo (header-logo) | `https://PENDING-ROLEX-LOGO/` | "Rolex" | ⚠️ Placeholder declarado — permitido por `isTestCampaign:true`, no vacío |
| Hero banner (hero-imagen) | `https://PENDING-CDN-UPLOAD/hero-banner.png` | "Rolex Datejust con esfera verde oliva, acero Oystersteel y oro Everose" | ⚠️ Placeholder declarado — permitido; alt descriptivo ya presente para cuando se genere el asset real |

0 etiquetas `<img>` sin atributo `alt` (verificado programáticamente sobre `final.html`).

## Legal

- `footer.disclosure` declara explícitamente que es una campaña de prueba y que el contenido procede de observación pública sin aprobación de Rolex — coincide literalmente con `00-brief/requirements.md` L-001/L-002/L-003 y con el patrón `public-source-campaign-pattern.md`.
- Ningún precio, referencia de catálogo, ni cifra técnica no verificada en ningún módulo (verificado en `05-copy/body-copy.md` → tabla de validación de claims).
- `footer.legalLine`: "© Rolex 2026" — genérico, sin dirección física real (coherente con `isTestCampaign:true`).

## Hallazgos

Ninguno de severidad alta. Los 2 placeholders de asset están correctamente declarados y permitidos por el estado de prueba de la campaña — ver `08-qa/final-checklist.md` para el desglose "aprobado para prueba" vs. "bloqueo de producción".
