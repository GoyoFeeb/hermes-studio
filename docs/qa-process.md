# QA Process: Hermes Newsletter System

## Visión general

El proceso de QA es obligatorio antes de cualquier exportación. Lo ejecuta el agente 08 — Email QA Specialist después de que el agente 07 — React Email Developer haya completado la implementación.

QA no corrige errores. Los detecta, los clasifica por severidad y los asigna al agente responsable.

## Áreas de QA

### QA visual

Verifica el aspecto visual de la newsletter en desktop (viewport 600px).

Qué se revisa:
- Titulares correctos contra body-copy.md
- Cuerpo de texto correcto
- CTAs correctos (texto y enlace)
- Imágenes correctas (src y alt)
- Colores corresponden a desktop-spec.md
- Tipografía correcta (font-family, tamaño, color)
- Espaciados correctos (padding, márgenes)
- Botones visualmente correctos
- Sin solapamientos ni desbordamiento de texto
- Sin texto cortado
- Preheader visible en preview
- Footer/legal completo

### QA responsive

Verifica el comportamiento en mobile (viewport 320px-480px).

Qué se revisa:
- Los módulos se apilan correctamente
- Las imágenes tienen max-width: 100% y no se desbordan
- Texto legible sin zoom (mínimo 14px)
- CTAs táctiles (mínimo 44px de alto)
- Padding lateral suficiente (mínimo 10px)
- Sin elementos ocultos que deberían mostrarse (o viceversa)
- Jerarquía visual mantenida en mobile
- Footer/legal legible en pantalla pequeña

### QA Outlook

Verifica la compatibilidad con Outlook desktop (Word rendering engine).

Qué se revisa:
- Botones con border-radius: ¿tienen VML fallback o esquinas rectas aceptables?
- Imágenes de fondo: ¿hay color de fondo fallback?
- Degradados: ¿hay color sólido fallback?
- Google Fonts: ¿el fallback web-safe es aceptable?
- Paddings en divs: ¿se renderizan correctamente en Outlook?
- Ancho del contenedor: ¿600px se renderiza bien?
- Imágenes sin width: ¿se estiran o desaparecen?
- Colores claros: ¿se renderizan bien o mutan?
- SVG: ¿hay PNG fallback?
- Layout general: ¿se mantiene la estructura?

### QA enlaces

Verifica todos los enlaces, CTAs e imágenes.

Qué se revisa por cada CTA/enlace:
- href es URL absoluta válida (no vacío, no "#", no "null")
- URL responde HTTP 200
- Texto del CTA es el aprobado
- Parámetros UTM presentes si se requieren
- Enlaces de baja y preferencias funcionales

Qué se revisa por cada imagen:
- src es URL absoluta válida
- Tiene width y height explícitos
- Tiene alt text descriptivo
- Formato compatible (JPG, PNG, GIF)
- Peso aceptable (< 200KB)

### QA legales

Verifica textos sensibles.

Qué se revisa:
- Textos legales copiados textualmente de requirements.md
- Precios exactamente del brief
- Promociones (descuentos, condiciones) exactamente del brief
- Fechas de validez correctas
- TAE/TIN/condiciones financieras exactas
- Ningún texto legal omitido o alterado
- Disclaimers presentes donde corresponden
- Enlaces a políticas legales funcionan

### QA datos

Verifica la consistencia entre el JSON, el código y el HTML renderizado.

Qué se revisa:
- JSON refleja fielmente el copy de body-copy.md
- HTML refleja fielmente el JSON
- Colores del HTML corresponden a desktop-spec.md
- Orden de módulos coincide con structure.md
- Asunto coincide con la opción recomendada
- Preheader coincide con la opción recomendada
- CTAs coinciden con cta-options.md

## Severidades

| Severidad | Significado | Acción |
|---|---|---|
| **Critical** | La newsletter no puede enviarse. Error funcional o legal. | Bloquear campaña. No se puede exportar. |
| **High** | Error grave que afecta a la experiencia o al mensaje. | Devolver al agente responsable. Debe corregirse antes de aprobar. |
| **Medium** | Error notable pero no bloqueante. Afecta a calidad visual. | Registrar y sugerir corrección. Puede aprobarse con risk aceptado. |
| **Low** | Error menor. Mejorable pero no urgente. | Registrar como mejora. No bloquea. |

### Ejemplos de errores critical

- Texto legal incorrecto, incompleto o alterado
- Precio incorrecto
- Promoción con descuento equivocado
- CTA principal sin href funcional
- Imagen crítica sin src
- Error de renderizado que impide leer la newsletter
- JSON inválido o no renderizable
- Asunto o preheader vacío
- Enlaces de baja/preferencias rotos
- Newsletter sin CTA principal

### Ejemplos de errores high

- Color que no corresponde a la especificación
- Imagen con alt text vacío
- CTA secundario sin href
- Módulo fuera de orden
- Texto que excede el espacio disponible
- Padding inconsistente entre módulos

### Ejemplos de errores medium

- Tono ligeramente fuera de marca
- Espaciado irregular pero no crítico
- Alt text genérico (mejorable)
- UTM faltante en enlace secundario

### Ejemplos de errores low

- Mínima variación de color (1-2 tonos de diferencia)
- Espaciado de 2px de diferencia con la especificación
- Alt text correcto pero mejorable

## Cuándo aprobar

La campaña se aprueba (✅) cuando:

1. No hay errores critical sin resolver.
2. Los errores high están corregidos o tienen un plan de corrección aceptado.
3. Los errores medium/low están documentados y aceptados.
4. El final-checklist está completo.
5. El QA visual, responsive, Outlook, enlaces y legales han sido ejecutados.

## Cuándo devolver

La campaña se devuelve (🔄) cuando:

1. Hay errores high que requieren corrección por un agente específico.
2. El agente responsable está claramente identificado.
3. Se genera return.md con instrucciones específicas.

Ciclo de devolución:
1. QA detecta error → registra en archivo QA correspondiente
2. QA genera return.md dirigido al agente responsable
3. QA informa al Orchestrator (estado: corrections)
4. Orchestrator activa al agente responsable
5. Agente corrige y devuelve al Orchestrator
6. Orchestrator reactiva QA
7. QA verifica corrección y actualiza estado del error

## Cuándo bloquear

La campaña se bloquea (❌) cuando:

1. Hay errores critical que impiden la exportación.
2. QA informa al Orchestrator.
3. El Orchestrator genera blocked-reason.md.
4. El flujo se detiene hasta que el usuario resuelva.

## Checklist final de QA

El archivo `08-qa/final-checklist.md` debe incluir estas categorías:

| Categoría | Elementos |
|---|---|
| Brief y estructura | 5 checks (objetivo, CTA, estructura, landing, longitud) |
| Diseño visual | 5 checks (colores, tipografía, botones, espaciados, jerarquía) |
| Copy | 6 checks (asunto, preheader, titulares, textos, CTAs, tono) |
| Enlaces e imágenes | 5 checks (CTAs href, imágenes src, alt, width/height, enlaces legales) |
| Legal y datos sensibles | 5 checks (textos legales, precios, promociones, fechas, condiciones) |
| Compatibilidad | 5 checks (Outlook, Gmail, Apple Mail, mobile, HTML válido) |
| Datos técnicos | 4 checks (JSON válido, tsc sin errores, React Email compila, HTML sin JS) |
| Accesibilidad | 5 checks (alt text, contraste, tamaño texto, CTAs identificables, enlaces distinguibles) |

Total: 40 checks.

## Archivos de QA

| Archivo | Contenido |
|---|---|
| `08-qa/visual-qa.md` | Revisión visual desktop por módulo |
| `08-qa/responsive-qa.md` | Revisión responsive mobile por módulo |
| `08-qa/outlook-qa.md` | Revisión compatibilidad Outlook |
| `08-qa/links-qa.md` | Revisión de enlaces, CTAs e imágenes |
| `08-qa/final-checklist.md` | Checklist completo de aprobación |
| `08-qa/return.md` | Instrucciones de devolución (solo si aplica) |
