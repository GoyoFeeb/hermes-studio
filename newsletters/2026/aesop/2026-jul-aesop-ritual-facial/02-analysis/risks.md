# Risks: Aesop — 2026-jul-aesop-ritual-facial

## Riesgos identificados

### 🔴 Alto: Frontera del lenguaje de diseño del motor

**Descripción:** Aesop se sitúa fuera de lo que el motor puede renderizar fielmente. El CTA real es outline (transparente, borde 1px, border-radius 0), pero el motor solo genera CTA sólidos (cta-bulletproof). Las tarjetas con borde/sombra no existen en Aesop. El motor asume estos elementos.

**Mitigación:** Se ha fijado radius.cta=0 en el brand pack (el primer pack del sistema con border-radius 0). Para el CTA, se usará cta-bulletproof sólido con border-radius 0 (compromiso: no es outline, pero al menos las esquinas son rectas como en la marca real). El CTA secundario (cta-secondary-bulletproof) es outline — evaluar si usarlo como CTA primario.

### 🟡 Medio: Nombre de productos que pueden escribirse mal

**Descripción:** Aesop tiene nombres de producto largos y muy específicos ("Parsley Seed Anti-Oxidant Intense Serum", "Resolute Facial Concentrate", "B Triple C Facial Balancing Gel"). Un error ortográfico es muy visible para quien conoce la marca.

**Mitigación:** Copiar LITERAL de la web. No parafrasear, no abreviar.

### 🟡 Medio: Logo sobre fondo oscuro

**Descripción:** El PNG del logo tiene fondo transparente con texto negro. Sobre fondo oscuro (#252525, #1A1A1A) el logo será invisible.

**Mitigación:** Usar solo sobre fondo crema #FFFEF2 (header). En banda de cierre, usar "Aesop" como texto en blanco.

### 🟡 Medio: Zapf-Humanist sin equivalente email-safe

**Descripción:** Aesop usa Zapf-Humanist para titulares editoriales y citas. No hay equivalente en web-safe fonts. Palatino Linotype sería la opción más cercana (diseñado por Hermann Zapf), pero no está en todas las plataformas.

**Alternativa:** Usar Arial/Helvetica para todo, compensando con letter-spacing y tamaño para evocar la elegancia tipográfica.

### 🟢 Bajo: Sin iconos decorativos

**Descripción:** El motor no tiene un componente de "3 bloques de texto plano sin ningún adorno". La variante columns-3-beneficios-sin-icono usa una barrita de color decorativa que Aesop no utiliza en su web.

**Mitigación:** Aceptar la barrita como el recurso más cercano disponible. No hay alternativa sin modificar el motor.

### 🟢 Bajo: Sin promociones ni descuentos

**Descripción:** Aesop no hace descuentos. Una campaña con urgencia comercial sería falsa para esta marca.

**Mitigación:** La campaña es editorial/informativa, no promocional. Sin urgencia, sin "oferta limitada", sin "ahora".
