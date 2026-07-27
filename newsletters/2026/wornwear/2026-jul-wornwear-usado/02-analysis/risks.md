# Risks: Patagonia Worn Wear — 2026-jul-wornwear-usado

## Riesgos identificados

### 🔴 Alto: Contraste CTA — RESUELTO

**Descripción:** El naranja #FA4616 con texto blanco #FFFFFF da 3.53:1 (falla AA). Eso es lo que usa la web real de Worn Wear, pero en email es una restricción no negociable.

**Resolución:** Se ha cambiado colors.ctaText de #FFFFFF a #000000 (negro, color estructural del pack — colors.primary, footer real de la marca). Contraste resultante: 5.95:1 ✅ PASA AA. Mismo criterio que Spotify (negro sobre verde #1ED760). Ver _changelog v2.2.1 del brand pack para la documentación completa. Es una decisión de accesibilidad del sistema, no un valor observado en el sitio.

### 🔴 Alto: Logo sobre fondo oscuro

**Descripción:** El único PNG disponible tiene fondo blanco intrínseco. No funcionará sobre fondo negro en banda de cierre ni sobre naranja en hero. Si se necesita logo en esas posiciones, hay que obtener una versión invertida (blanco sobre transparente).

**Mitigación:** Usar solo sobre fondo blanco (header). En banda de cierre, omitir logo o usar texto "WORN WEAR" en blanco.

### 🟡 Medio: Traducción de tono al español

**Descripción:** "Put Used to Use" es un juego de palabras que funciona en inglés pero no tiene equivalente directo en español. La traducción "Pon lo usado a trabajar" captura el espíritu pero no la sonoridad. Si se fuerza una traducción literal, se pierde el tono.

**Mitigación:** El brief ya indica que el titular es referencia de tono, no necesariamente literal. La copia en español debe buscar una frase corta, directa y con gancho en español, no una traducción.

### 🟡 Medio: Sin iconos decorativos en la marca

**Descripción:** Worn Wear no usa iconos en ninguna sección de su web. El patrón institutional del sistema incluye `columns-3-beneficios` con iconGlyph emoji. Usarlo rompería la identidad visual de la marca. `card-tarifa-3` exige icon obligatorio en cada ítem (img 48×48) y está fijado a exactamente 3 tarjetas — no es una alternativa viable.

**Mitigación:** Usar `columns-3-beneficios-sin-icono` (barrita decorativa en vez de icono) o `usp-cards-sin-icono` (tarjetas con borde sin icono). Ambos existen en `engine/components/`.

### 🟡 Medio: Fotografía lifestyle vs. producto aislado

**Descripción:** La marca usa dos tratamientos fotográficos distintos (hero lifestyle + producto aislado). El sistema puede generar hero-imagen con una foto lifestyle, pero los módulos de abajo (category-grid, card-tarifa) necesitan producto aislado sobre blanco — no existen esas imágenes en el sistema.

**Mitigación:** hero-imagen con foto lifestyle descargada de la web. Para módulos de producto, usar placeholder hasta que se obtengan las imágenes específicas.

### 🟢 Bajo: Precios en la newsletter

**Descripción:** El catálogo de usado tiene precios dinámicos. Si se incluye un producto con precio en la newsletter, puede quedar desactualizado.

**Mitigación:** No incluir precios de producto concretos. La campaña es de awareness (conocer la colección), no de compra directa.

### 🟢 Bajo: Sin dark mode

**Descripción:** El motor fuerza color-scheme:light. La marca real usa blanco y beige como fondos dominantes, que funcionan bien en modo claro. Dark mode no es prioritario para esta campaña de test.
