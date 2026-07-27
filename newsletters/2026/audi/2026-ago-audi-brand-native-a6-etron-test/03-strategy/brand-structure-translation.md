# Brand Structure Translation — Audi A6 Sportback e-tron

> Documento que vincula la estructura real de la página de Audi con la secuencia de módulos del email.
> Requerido por el sistema brand-native (2026-07-27) y verificado por check-structural-differentiation.ts (Gate 12).

## Página de referencia
**URL**: https://www.audi.es/es/modelos/a6-e-tron/a6-sportback-e-tron/
**Fecha de observación**: 2026-08-01

## Secciones reales de la página de Audi A6 Sportback e-tron

Según `layout.contentRhythm` y `layout.brandStructure` del brand pack Audi v2.2.1:

| # | Sección real de audi.es | ¿Se traduce? | Módulo email | Justificación |
|---|------------------------|:------------:|-------------|---------------|
| 1 | **Hero**: Video/foto del A6 Sportback e-tron a pantalla completa + título + CTAs | ✅ Sí | `hero-imagen` | La página abre con fotografía/video dominante, titular y CTAs. El email replica esta apertura con arte generado + titular HTML. Sin texto sobre la imagen — igual que audi.es. |
| 2 | **Stats strip**: 340 kW / 4.5s / 773 km con etiquetas cortas | ✅ Sí | `columns-3-beneficios-sin-icono` | Audi presenta SIEMPRE 3 cifras clave en formato limpio (número + etiqueta). Es su sello estructural. En email, este bloque va tras los editoriales como contrapunto de datos duros. |
| 3 | **Destacados (carrusel)**: 8 bloques editoriales con foto + título + body corto | ✅ Sí (parcial) | `editorial-foto-texto` + `editorial-foto-texto-inverso` | Traducimos 2 highlights representativos: "Diseño aerodinámico" y "Interior tecnológico". Los 8 items del carrusel son demasiados para email — elegimos los 2 más representativos que cubren las dimensiones clave del producto (exterior e interior). |
| 4 | **Sección Diseño**: Imágenes de detalle del exterior + copy técnico | ✅ Sí | `editorial-foto-texto` | La sección de diseño en audi.es usa foto a la izquierda, texto a la derecha. Misma disposición en el componente editorial-foto-texto. |
| 5 | **Sección Interior/Tecnología**: Habitáculo, pantallas, Bang & Olufsen | ✅ Sí | `editorial-foto-texto-inverso` | La sección interior invierte el orden visual para variar el ritmo — como el componente inverso (texto izquierda, imagen derecha). |
| 6 | **Sección Autonomía y Carga**: Infografía + datos técnicos detallados | ❌ No | — | Datos ya cubiertos en stats strip (#340 kW / 773 km) y disclosure. La infografía interactiva no se traduce a email estático. |
| 7 | **Configurador 3D interactivo**: Personalización en tiempo real | ❌ No | — | Funcionalidad interactiva — imposible en email. Se enlaza desde banda-cierre con CTA "Configurar mi Audi". |
| 8 | **Banda de cierre**: CTA sobre fondo oscuro | ✅ Sí | `banda-cierre` | El patrón de cierre de Audi es siempre CTA dominante sobre fondo oscuro #101319. |

## Mapeo visual: página real → email

```
PÁGINA AUDI A6 (audi.es)                     EMAIL (2026-ago-audi-brand-native)
══════════════════════════════════            ══════════════════════════════════
HERO VIDEO/FOTO + título + CTAs     →        hero-imagen (foto generada + título + CTA)
                                           
STATS STRIP (340 kW / 4.5s / 773k)  →        [va después de editoriales como contrapunto]
                                           
DESTACADOS (carrusel foto+texto):           EDITORIALES FOTO+TEXTO:
  • Audi virtual mirrors (foto+texto)        → editorial-foto-texto (diseño/silueta)  
  • Faros Matrix LED (foto+texto)              
  • Techo panorámico                         
  • Pantalla panorámica (foto interior)      → editorial-foto-texto-inverso (interior)
  • Bang & Olufsen (foto+texto)              
  • Sistemas asistencia (foto+texto)         
                                           
[otras secciones no traducidas]             
                                           
CONFIGURADOR                       →        CTA "Configurar mi A6" en banda-cierre
                                           
CTA SOLICITAR OFERTA (fondo oscuro) →        banda-cierre (color deep #101319)
```

## Decisiones estructurales que diferencian esta campaña de una plantilla genérica

### 1. Sin `intro-cta` de transición
**Decisión**: La campaña no usa ningún módulo `intro-cta`.
**Motivo contra página real**: audi.es no tiene un bloque de texto de transición entre el hero y los destacados. La página pasa directamente de la foto hero al carrusel de destacados. Insertar un `intro-cta` sería introducir un módulo de relleno que no existe en la estructura real de la marca.

**Contraste con campaña anterior** (`2026-jul-audi-premium`): la campaña anterior usaba **3** módulos `intro-cta` consecutivos como sustitutos de bloques editoriales. Esto es exactamente la estructura "plantilla" que el enfoque brand-native busca eliminar.

### 2. Bloques editoriales con foto en vez de texto plano
**Decisión**: Los bloques de contenido usan `editorial-foto-texto*` con fotografía real.
**Motivo contra página real**: Cada destacado de audi.es combina fotografía + texto breve. El email replica esta proporción: imagen ~46% del ancho, texto ~54%, con body breve (15-25 palabras).

### 3. Alternancia de variantes (normal ↔ inverso)
**Decisión**: `editorial-foto-texto` para diseño exterior → `editorial-foto-texto-inverso` para interior.
**Motivo contra página real**: audi.es presenta primero el exterior del vehículo (foto dominante), luego el interior (misma importancia visual pero diferente composición). Alternar el orden mantiene el ritmo visual del email sin que dos bloques consecutivos se vean iguales.

### 4. Stats como bloque independiente, no como parte del hero
**Decisión**: `columns-3-beneficios-sin-icono` después de los editoriales, no dentro del hero.
**Motivo contra página real**: En audi.es, las specs clave (340 kW, 4.5s, 773 km) aparecen debajo del hero como un bloque separado con su propio fondo y jerarquía visual. El email replica esta separación: hero primero (puro impacto visual), luego contenido editorial, luego datos duros como validación racional.

### 5. Sin trust-bar, sin usp-cards, sin category-grid
**Decisión**: Se omiten todos los módulos de servicios/educativos.
**Motivo**: Estos módulos no aparecen en la página de producto de Audi. Son bloques de marca de servicios (institutional pattern), no de una marca automotriz premium.

### 6. Footer con disclosure WLTP
**Decisión**: Footer incluye disclosure con notas WLTP sobre consumo y CO₂.
**Motivo contra página real**: audi.es incluye notas a pie de página numeradas para cada cifra citada. El email consolida la más importante (WLTP) en el disclosure del footer.

## Resumen de diferenciación estructural

| Aspecto | Campaña anterior (2026-jul-audi-premium) | Campaña brand-native (esta) |
|---------|------------------------------------------|----------------------------|
| intro-cta | 3 repeticiones → estructura genérica | 0 → se reemplazan por editorial-foto-texto* |
| Bloques con foto | 0 (solo hero) | 2 (editorial-foto-texto + inverso) |
| Ritmo visual | Plano (texto→texto→texto) | Dinámico (foto→foto con alternancia→datos→cierre) |
| Traducción de página real | No — secuencia genérica del template | Sí — cada módulo traza a una sección real de audi.es |
| Uso de brandStructure | No existía | Sí — 6 signature sections mapeadas |
