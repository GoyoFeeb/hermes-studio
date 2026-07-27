# 06 — Data Specialist

Base: fila `06` de `pipeline-skill/references/agent-roles.md` + fase 06 de `phase-gates.md`
(F2: escribe `campaign-data.json` contra el schema del motor — el `newsletter-data.json` de
React Email se archivó en F4). Revisado 2026-07-21 (backup en
`_archive/agents-backup-2026-07-21/`).

## Objetivo

Convertir lo producido por 03/04/05 en el único archivo que el motor necesita:
`06-data/campaign-data.json`. Última fase antes del código — la precisión de nombres de campo
importa aquí más que en ningún otro agente.

## Entradas / Lee

`05-copy/*.md` (los 4), `03-strategy/structure.md` (orden de módulos), `04-design/*.md`
(campos visuales que en realidad son dato, ej. números de paso), y la ruta del brand pack que
02 dejó en su entrega.

## Tareas

1. Montar `metadata` (campaña, cliente, asunto elegido, preheader, remitente, versión, flags
   `isTestCampaign`/`productionReady`), `brand` (ruta del pack), `pattern`, `utm`.
2. Montar `modules[]` en el orden exacto de `structure.md`, con el copy de 05 campo a campo.
   Para módulos con campo de icono, usar exactamente la variante de componente
   (`iconGlyph`/`-img`/`-sin-icono`) que 04 decidió en `assets-notes.md` (ver
   `04-email-designer.md` §"Elegir variante de icono") — nunca por defecto la variante con
   emoji sin comprobar si 04 dejó escrita otra.
3. **Si `structure.md` eligió `hero-imagen`** (decisión de 03, ver
   `03-newsletter-architect.md` §"Elegir hero"): generar el arte real del banner — ver
   §"Generar el arte del hero" más abajo — ANTES de dar por cerrado este módulo. No se escribe
   un `bannerSrc` de relleno "para luego": si el arte aún no está subido al CDN, el módulo queda
   con un placeholder EXPLÍCITO (`https://PENDING-CDN-UPLOAD/...`) y la campaña se reporta como
   bloqueada en ese punto, nunca se disimula con una URL que parezca válida.
4. Validar contra el schema y corregir hasta 0 errores.

### Tabla de campos por componente (no negociable — debe coincidir con `MODULE_ADAPTERS` de `engine/lib/assemble.js`)

| `component` | Campos de `data` |
|---|---|
| `hero-asimetrico` | `h1`, `stat.{number,label}`, `subtitle`, `cta.{href,label}` |
| `hero-centrado` | `brandName`, `h1`, `subtitle`, `cta.{href,label}` |
| `hero-imagen` | `bannerSrc` (https del CDN — NUNCA un placeholder en la entrega final), `bannerAlt`, `brandName`, `h1`, `subtitle`, `cta.{href,label}` — ver §"Generar el arte del hero" |
| `trust-bar` | `items[]` (exactamente 3, cada uno `{text}`) |
| `card-tarifa` | `eyebrow`, `title`, `subtitle`, `items[]` (2-4: `{icon,title,body,href,linkLabel}`) |
| `pasos` | `eyebrow`, `title`, `items[]` (exactamente 3: `{number,title,body}`) |
| `lista-premium` | `eyebrow`, `title`, `items[]` (3-4: `{icon,title,body}`) |
| `banda-cierre` | `title`, `body`, `cta.{href,label}` |
| `footer` | `brandName`, `tagline`, `disclosure`, `unsubscribeUrl`, `preferencesUrl`, `legalLine` |
| `editorial-foto-texto` | `imageSrc` (https del CDN — nunca file:// ni relativa), `imageAlt`, `eyebrow`, `title`, `body`, `cta.{href,label}` |
| `editorial-foto-texto-inverso` | Mismos campos que `editorial-foto-texto` |

Nota: esta tabla cubre los componentes del patrón `saving`. Para `institutional` (Nivel 2/3, UAX y
similares) ver `patterns/institutional.md` — mismo principio: la tabla debe coincidir con
`MODULE_ADAPTERS`, nunca inventar campos de memoria.

## Generar el arte del hero (si el componente es `hero-imagen`)

`hero-imagen` es una variante híbrida: el arte lo genera la API de imágenes de OpenAI (SIN
texto dentro); titular/subtítulo/CTA siguen siendo los campos HTML de arriba. Este agente ya
tiene todo lo que el script necesita (el `cta.href` real de esta campaña, la ruta del brand pack
de 02), así que lo ejecuta directamente como parte de esta fase — no es un script aparte que el
usuario recuerda correr después:

```
npm run generate-hero-image -- --brand {slug} --theme "{ángulo de campaña de 03}" \
  --campaign {ruta de esta campaña} --source landing --url {cta.href real de esta campaña}
```

- REQUIERE `OPENAI_API_KEY` en `.env` (raíz del proyecto) con facturación activa y organización
  verificada (`platform.openai.com/settings/organization/general`, ver `.env.example`). Si falta
  o está bloqueada, el script lo señala explícitamente — repórtalo como bloqueo, no lo omitas en
  silencio dejando `hero-centrado` sin decirlo (precedente del fallo:
  `2026-jul-tarifalo-compara-luz`).
- `--source landing --url {url}` es no interactivo (pensado para que este agente lo invoque sin
  depender de que haya un humano respondiendo preguntas en terminal) — captura esa landing con
  Playwright (3 vistas a doble resolución) y usa la propia OpenAI (visión) para anclar el arte a
  su estilo real, en vez de un prompt genérico de solo colores.
- Salida: `brands/{slug}/design-input/hero-banner.png` (y `hero-banner-original.png`).
- **Lo único que sigue siendo 100% manual:** subir ese PNG al CDN
  (`feebbodigital.com/creativities-library/{slug}/...`) y confirmar la URL — pídesela al usuario
  antes de escribir `bannerSrc` en `campaign-data.json`. Mientras no la tengas, `bannerSrc` queda
  en placeholder explícito (`https://PENDING-CDN-UPLOAD/{slug}/hero-banner.png`) y el Gate 5
  (assets HTTP 200) lo marcará en rojo — correcto, es la señal de que falta ese paso, no un bug.

## Salidas / Escribe

`06-data/campaign-data.json` — validado contra `engine/schema/campaign-data.schema.json`.

## Validaciones (antes de entregar)

- Valida con `ajv` contra el schema (0 errores) — o vía el paso 1 de `build-newsletter.js`;
  cualquiera de los dos, pero ANTES de entregar, no descubierto en 07.
- Orden de `modules[]` = orden de `structure.md`, sin módulos de más ni de menos.
- Todo `href`/`icon` es URL `https://` absoluta con UTM ya incluida donde corresponde
  (convención `utm.source/medium/campaign` + `utm_content` por módulo).
- Cero literales `[PENDIENTE]` — si un dato no está confirmado: campo omitido si el schema lo
  permite, módulo opcional omitido, o bloqueo (según el patrón).
- **URLs de imagen en `editorial-foto-texto*`**: `imageSrc` debe ser siempre HTTPS o contener
  el placeholder explícito `PENDING-CDN-UPLOAD` (que el Gate 5 / Gate 10 de production-gate-motor
  detecta automáticamente). Prohibido usar `file://` o rutas relativas bajo cualquier concepto.
- Caso especial que NO bloquea: `footer.unsubscribeUrl`/`preferencesUrl` aceptan merge-tags de
  ESP entre corchetes mayúsculas (`[UNSUBSCRIBE_LINK]`) — `$def espResolvedUrl` del schema los
  distingue de `[PENDIENTE]`.
- El copy pegado es byte a byte el de 05 — no se "mejora" al transcribir.

## Fase completada cuando

`campaign-data.json` existe, valida contra el schema con 0 errores, las validaciones de arriba
pasan, y — si el hero es `hero-imagen` — el arte está generado (`bannerSrc` puede seguir en
placeholder explícito si el usuario aún no ha dado la URL del CDN; eso es un pendiente
documentado, no un bloqueo de esta fase, ver `next-steps.md` de la campaña).

## Bloquea si

- El JSON no valida contra el schema.
- Falta un módulo obligatorio del patrón.
- Algún `href`/`icon` no es https absoluta, o hay un `[PENDIENTE]` en texto.
- El orden no coincide con `structure.md`.
- El hero es `hero-imagen` y este agente no intentó generar el arte (falta de
  `OPENAI_API_KEY`/facturación cuenta como bloqueo documentado, no como excusa para omitir el
  paso en silencio — repórtalo como hallazgo).
- `productionReady: true` con `bannerSrc` todavía en placeholder (`PENDING-CDN-UPLOAD` o
  similar) — la campaña no puede marcarse lista para producción con un asset pendiente.

## Entrega a

`07-html-email-developer`. Debe recibir: la ruta exacta de `campaign-data.json` y la de
`structure.md` (07 verifica la coincidencia de orden como última barrera).

## No hacer

- No escribir `newsletter-data.json` ni `newsletter-data.ts` (formato del pipeline archivado).
- No elegir entre opciones de copy (→ 05 debe entregarlas ya decididas u ordenadas).
- No inventar nombres de campo: la tabla de arriba es literal, no orientativa.
