# Plantilla de briefing para campaña real

Usa esta plantilla antes de ejecutar `create-campaign` para recoger toda la información necesaria. Rellenar los campos obligatorios evita bloqueos durante los agentes 01→09 y garantiza que la campaña pueda cerrarse como `productionReady`.

---

## Datos generales

| Campo | Descripción | Obligatorio | Lo necesita |
|---|---|---|---|
| Cliente | Nombre del cliente | Sí | 00 Orchestrator, 01 Briefing |
| Año | Año de la campaña (4 dígitos) | Sí | 00 Orchestrator |
| Nombre de campaña | Slug único para la carpeta. Ej: `2026-oct-revision-seguros` | Sí | 00 Orchestrator |
| Fecha prevista | Fecha de envío estimada o de creación del brief | Sí | 00 Orchestrator |
| Tipo de campaña | Informativa / Promocional / Transaccional / Educativa / Branding / Mixta | Recomendado | 03 Newsletter Architect |

---

## Objetivo y mensaje

| Campo | Descripción | Ejemplo | Obligatorio | Lo necesita |
|---|---|---|---|---|
| Objetivo de campaña | ¿Qué se quiere conseguir? | "Captar leads para el servicio de revisión de seguros" | **Sí** | 01 Briefing, 03 Architect |
| Público objetivo | ¿A quién va dirigida? | "Usuarios de OCU con seguro de hogar o de coche" | Recomendado | 03 Architect, 05 Copywriter |
| Mensaje principal | ¿Qué se quiere comunicar? | "Revisar tus seguros puede ayudarte a ahorrar hasta X€ al año" | **Sí** | 01 Briefing, 03 Architect, 05 Copywriter |
| Oferta o promoción | Descripción de la oferta, descuento o servicio promocionado | "Descuento del 20% en la primera revisión" | Si aplica | 01 Briefing, 05 Copywriter |

---

## CTA y enlaces

| Campo | Descripción | Ejemplo | Obligatorio | Lo necesita |
|---|---|---|---|---|
| CTA principal | Texto del botón principal | "Revisar mis seguros" | **Sí** | 01 Briefing, 04 Design, 05 Copywriter, 06 Data |
| URL principal | Enlace del CTA principal (absoluta, https://) | `https://www.ocu.org/seguros/revision-oferta` | **Sí** | 01 Briefing, 06 Data, 09 Export |
| Asunto | Línea de asunto del email (máx. 60-70 caracteres recomendado) | "¿Tu seguro sigue siendo la mejor opción?" | Recomendado | 05 Copywriter |
| Preheader | Texto de preheader (máx. 100-120 caracteres) | "Compara tu seguro actual con las mejores ofertas del mercado." | Recomendado | 05 Copywriter |

---

## Textos legales

| Campo | Descripción | Ejemplo | Obligatorio | Lo necesita |
|---|---|---|---|---|
| Textos legales | Texto legal o disclaimer requerido | "Promoción válida hasta el 31/12/2026. Consulta condiciones en la web." | Si aplica | 01 Briefing, 05 Copywriter, 06 Data |
| ¿Aplica texto legal? | Marcar si hay textos legales obligatorios | Sí / No | **Sí** (confirmación explícita) | 01 Briefing (bloquea si falta) |

---

## Remitente y footer

| Campo | Descripción | Ejemplo | Obligatorio | Lo necesita |
|---|---|---|---|---|
| From name | Nombre del remitente visible en el email | "OCU" | Recomendado | 06 Data |
| From email | Dirección de envío | `newsletter@ocu.org` | **Sí** | 06 Data, 09 Export |
| Enlace darse de baja | URL para darse de baja | `https://www.ocu.org/email/baja?token=...` | **Sí** | 06 Data, 09 Export |
| Enlace preferencias | URL para gestionar preferencias | `https://www.ocu.org/email/preferencias` | Recomendado | 06 Data |
| Enlace contacto | URL o email de contacto | `https://www.ocu.org/contacto` | Recomendado | 06 Data |

---

## Assets visuales

| Campo | Descripción | Especificaciones | Obligatorio | Lo necesita |
|---|---|---|---|---|
| Logo | Logotipo del cliente | PNG con transparencia, 200x60px o SVG | **Sí** | 02 Analysis, 07 React Email |
| Iconos (benefits-grid) | Iconos para sección de beneficios | PNG, 48x48px, outline o filled | Recomendado | 02 Analysis, 04 Design |
| Hero image | Imagen principal del hero | JPG/PNG, 600x300px, <200KB | Recomendado | 04 Design |
| Imágenes de producto | Imágenes adicionales si las hay | JPG/PNG, según diseño | Recomendado | 04 Design |
| Paleta / guía de marca | Documento con colores, tipografías y estilos | PDF, web o documento interno | Recomendado | 02 Analysis, 04 Design |
| Tipografía corporativa | Fuente principal y secundaria | Nombre de la fuente y fallback | Recomendado | 04 Design |

---

## Restricciones

| Campo | Descripción | Ejemplo | Obligatorio | Lo necesita |
|---|---|---|---|---|
| Restricciones de copy | Tono, claims prohibidos, términos obligatorios | "No usar 'garantizado'. Tono institucional." | Recomendado | 05 Copywriter |
| Restricciones legales | Condiciones especiales de la comunicación | "Incluir siempre NIF del anunciante" | Si aplica | 01 Briefing, 05 Copywriter |
| Restricciones de diseño | Limitaciones de formato, layout o colores | "Mantener fondo blanco. No usar naranja." | Recomendado | 04 Design |
| Restricciones de compatibilidad | Clientes de email donde debe validarse | "Prioridad: Outlook 2019, Gmail, Apple Mail" | Recomendado | 08 QA |
| Claims prohibidos | Textos que no deben aparecer | "Mejor del mercado", "Ahorro garantizado" | Recomendado | 05 Copywriter |

---

## Plataforma de envío

| Campo | Descripción | Ejemplo | Obligatorio | Lo necesita |
|---|---|---|---|---|
| Plataforma de envío | Sistema de email marketing utilizado | "Doctorsender" / "Mailchimp" / "HubSpot" | **Sí** | 09 Export |
| ¿Requiere inline CSS? | La plataforma necesita estilos inline | Mailchimp → Sí, Doctorsender → No | **Sí** | 09 Export |
| UTM parameters | Parámetros UTM para tracking | `utm_source=newsletter&utm_medium=email&utm_campaign=...` | Recomendado | 06 Data |

---

## Observaciones internas

| Campo | Descripción | Ejemplo |
|---|---|---|
| Notas internas | Cualquier contexto adicional relevante | "Campaña para acompañar el lanzamiento de un nuevo servicio." |
| Enlaces de referencia | Landing, capturas, newsletters anteriores, guías de estilo | `https://www.ocu.org/seguros/revision-landing` |

---

## Checklist mínimo antes de crear campaña

Antes de ejecutar `npm run create-campaign`, verifica que los siguientes elementos están disponibles o confirmados:

| # | Elemento | Estado requerido |
|---|---|---|
| 1 | URL real validada (funciona, no es ficticia) | ✅ Confirmada |
| 2 | CTA definido (texto final) | ✅ Definido |
| 3 | Textos legales confirmados (o confirmación de que no aplican) | ✅ Confirmados |
| 4 | From email definido | ✅ Definido |
| 5 | Enlace de baja disponible | ✅ Disponible |
| 6 | Enlace de preferencias disponible (o confirmación de que no es necesario) | ✅ Disponible / No necesario |
| 7 | Enlace de contacto disponible (o confirmación de que no es necesario) | ✅ Disponible / No necesario |
| 8 | Logo disponible (formato PNG con transparencia) | ✅ Disponible |
| 9 | Assets principales (iconos, imágenes) disponibles o marcados como no necesarios | ✅ Disponibles / No necesarios |
| 10 | Campaña no ficticia (datos reales de cliente) | ✅ Real |
| 11 | Aprobación de marca obtenida (briefing firmado o conformidad vía email) | ✅ Obtenida |
| 12 | `productionReady: true` permitido solo si todos los anteriores están completos | ✅ Permitido |

Si algún elemento está marcado como `❌ Pendiente`, la campaña no debe marcarse como `productionReady` y debe cerrarse con tipo `prueba interna` (similar a la campaña OCU 2026-jul-moneyman).

---

## Campos que bloquean producción si faltan

Los siguientes campos, si están ausentes o son placeholders, bloquean la campaña para producción real. La campaña solo podrá cerrarse como `prueba interna`:

| # | Campo | Motivo |
|---|---|---|
| 1 | URL principal (href) | Sin URL funcional, el CTA no lleva a ninguna parte |
| 2 | Textos legales (o confirmación "no aplica") | Riesgo legal si se envían condiciones incorrectas o faltan disclaimers obligatorios |
| 3 | From email | El email no tiene remitente funcional |
| 4 | Enlace darse de baja | Obligatorio por ley en comunicaciones comerciales |
| 5 | Logo real | La cabecera sin logo no representa la marca |
| 6 | Aprobación de marca | Sin aprobación, el diseño y copy pueden no alinearse con la marca |
| 7 | `productionReady: false` | Mientras este flag sea `false`, el sistema no permite uso en producción |
| 8 | `isTestCampaign: true` | Mientras la campaña esté marcada como prueba, no debe enviarse a usuarios reales |

---

## Ejemplo completo de briefing real

> **⚠️ Este ejemplo contiene datos ficticios. No usar para una campaña real sin verificar.**

```yaml
cliente: OCU
año: 2026
nombre_campaña: 2026-oct-revision-seguros
fecha_prevista: 2026-10-15
tipo_campaña: Promocional / Informativa

objetivo: >
  Conseguir que los usuarios soliciten una revisión gratuita de sus seguros
  de hogar y coche para encontrar posibles ahorros.

publico_objetivo: >
  Usuarios de OCU mayores de 35 años con seguro de hogar o de coche,
  interesados en reducir gastos fijos.

mensaje_principal: >
  Revisar tus seguros una vez al año puede ayudarte a encontrar
  coberturas mejores por menos precio.

oferta: >
  Primera revisión gratuita sin compromiso de contratación.

cta_principal: Revisar mis seguros
url_principal: https://www.ocu.org/seguros/revision-oct-2026

asunto: "¿Has revisado tus seguros este año?"
preheader: >
  Compara tu seguro actual con las mejores ofertas del mercado
  y descubre si podrías estar ahorrando.

textos_legales: >
  Revisión gratuita sin compromiso. Oferta válida hasta el 15/11/2026
  para nuevos usuarios. Consulta condiciones en la web.
aplica_texto_legal: Sí

from_name: OCU
from_email: newsletter@ocu.org

enlace_baja: https://www.ocu.org/email/baja?token=USUARIO123
enlace_preferencias: https://www.ocu.org/email/preferencias?token=USUARIO123
enlace_contacto: https://www.ocu.org/contacto

logo: assets/ocu-logo-200x60.png
iconos:
  - hogar: assets/icon-hogar-48x48.png
  - coche: assets/icon-coche-48x48.png
  - salud: assets/icon-salud-48x48.png
  - ahorro: assets/icon-ahorro-48x48.png
hero_image: assets/hero-revision-seguros-600x300.jpg

paleta:
  primario: "#004C99"
  secundario: "#E6F0FA"
  texto: "#333333"
  titulares: "#1A1A1A"
  fondo: "#FFFFFF"
  fondo_seccion: "#F5F8FC"
  cta_fondo: "#004C99"
  cta_texto: "#FFFFFF"

tipografia:
  titulares: "Open Sans, Arial, Helvetica, sans-serif"
  cuerpo: "Arial, Helvetica, sans-serif"

restricciones_copy:
  - "No usar 'garantizado'"
  - "Tono: claro, directo, útil"
  - "No prometer ahorro garantizado"
  - "Usar condicional: 'podrías ahorrar' no 'ahorrarás'"

claims_prohibidos:
  - "Mejor del mercado"
  - "Ahorro garantizado"
  - "Oferta limitada" (no aplica)

plataforma_envio: Mailchimp
inline_css_requerido: Sí

utm:
  source: newsletter
  medium: email
  campaign: revision-seguros-2026-oct
  content: "{{CTA}}"

referencias:
  - https://www.ocu.org/seguros/revision-landing
  - newsletters/2025/ocu/2025-jul-revision-seguros/

notas_internas: >
  Campaña para acompañar el lanzamiento del nuevo servicio
  de revisión de seguros. El HTML debe probarse especialmente
  en Outlook 2019 por el uso de border-radius en los CTAs.
```

---

## Cómo usar esta plantilla antes de ejecutar create-campaign

### Paso 1 — Recoger información

Rellena la plantilla con el cliente. Usa el checklist mínimo para asegurarte de que todos los datos obligatorios están disponibles.

### Paso 2 — Crear la campaña

```bash
npm run create-campaign -- \
  --year 2026 \
  --client ocu \
  --client-name "OCU" \
  --campaign 2026-oct-revision-seguros \
  --date 2026-10-01 \
  --cta "Revisar mis seguros" \
  --url "https://www.ocu.org/seguros/revision-oct-2026"
```

### Paso 3 — Preparar React Email

```bash
npm run prepare-react-email -- \
  --campaign newsletters/2026/ocu/2026-oct-revision-seguros
```

### Paso 4 — Ejecutar agentes 01→09

Cada agente leerá el brief y generará sus entregables. Si falta información crítica, el agente 01 bloqueará la campaña y pedirá los datos necesarios.

### Paso 5 — Exportar y validar

```bash
npm run export-html -- \
  --campaign newsletters/2026/ocu/2026-oct-revision-seguros \
  --inline --force

npm run preview-html -- \
  --campaign newsletters/2026/ocu/2026-oct-revision-seguros \
  --force
```

### Paso 6 — Producción

Solo cuando el checklist mínimo esté completo, `production-blockers.md` esté vacío, y QA haya aprobado para producción:
- Establecer `productionReady: true`
- Establecer `isTestCampaign: false`
- Subir `final.html` (o `final-inline.html` si la plataforma lo requiere) a la plataforma de email marketing
