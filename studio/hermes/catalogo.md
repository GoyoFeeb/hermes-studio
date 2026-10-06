# Catálogo de módulos de Studio

> Generado por `npm run build-catalog` desde los componentes del motor (`engine/components`). No editar a mano.
> Cada módulo: `studio/hermes/modulos/<id>.html` (HTML de email probado en Outlook, Gmail y modo oscuro, filas
> `<tr>` para la tabla de 600 px de la base técnica) y `<id>.png` (cómo se ve). Los ejemplos están renderizados
> con el brand pack de otra marca: se reutiliza la ESTRUCTURA, no sus textos, colores ni fotos.

| Módulo | Grupo | Qué es | Cuándo usarlo | Renderizado con |
|---|---|---|---|---|
| `header-logo` | Cabecera | Logo centrado sobre fondo de marca, con etiqueta opcional. | Casi siempre arriba; separado del hero. | adeslas |
| `hero-imagen` | Hero | Foto grande a todo el ancho + titular, subtítulo y CTA en texto vivo. | Producto o marca con fotografía fuerte (patrón fotografía primero). | adidas |
| `hero-centrado` | Hero | Titular y subtítulo centrados sobre color de marca, sin foto, + CTA. | Mensaje institucional o de servicio sin foto protagonista. | adeslas |
| `hero-asimetrico` | Hero | Titular a la izquierda y una cifra grande a la derecha (dato de ahorro, precio), + CTA. | Ofertas con una cifra verificada que es el gancho (patrón oferta y precio). | paraycompara |
| `intro-cta` | Texto | Bloque de título + párrafo + CTA secundario. | Introducir el mensaje tras el hero o abrir una sección. | adeslas |
| `intro-cta-asimetrico` | Texto | Título y párrafo a la izquierda (64 %), CTA a la derecha (36 %) en la misma fila. | Igual que intro-cta, con un ritmo menos centrado. | rolex |
| `editorial-foto-texto` | Foto + texto | Foto a un lado y texto con CTA al otro, en dos columnas (se apila en móvil). | Hay una segunda foto real y útil (producto en uso, detalle) distinta del hero. | adidas |
| `editorial-foto-texto-inverso` | Foto + texto | Como editorial-foto-texto con la foto al otro lado. | Alternar con editorial-foto-texto para no repetir composición. | apple |
| `columns-3-beneficios` | Listas | 2-4 beneficios en columnas con icono, título y texto; destacado de sección opcional. | Ventajas paralelas del producto o servicio (con iconos de la marca). | adeslas |
| `columns-3-beneficios-sin-icono` | Listas | 2-4 beneficios en columnas solo con título y texto. | Marcas que no usan iconos ni emoji (premium, fotografía). | adidas |
| `columns-3-beneficios-asimetrico` | Listas | Beneficios en filas apiladas: icono en halo a la izquierda y texto a la derecha. | Beneficios con más texto, o para romper una fila de columnas anterior. | adeslas |
| `lista-premium` | Listas | 3-4 tarjetas apiladas con icono en insignia, título y texto. | Características sin orden entre sí (materiales, tecnología, garantía). | paraycompara |
| `lista-premium-2col` | Listas | Las tarjetas de lista-premium en rejilla de 2 columnas. | Igual que lista-premium con menos altura. | paraycompara |
| `pasos` | Proceso | 2-4 pasos numerados en fila (círculos con número + título + texto). | Un proceso real y ordenado: cómo comprar, cómo funciona, cómo reservar. | paraycompara |
| `pasos-vertical` | Proceso | Los pasos apilados con una línea que conecta los círculos. | Igual que pasos, con textos más largos o en móvil. | paraycompara |
| `metric-strip-premium` | Datos | Franja de 2-4 cifras grandes con su etiqueta. | Cifras técnicas o de marca verificadas (autonomía, años, peso…). | apple |
| `card-tarifa` | Ofertas | Rejilla 2×2 de tarjetas con icono, título, texto y enlace. | Comparar 4 opciones, tarifas o productos. | paraycompara |
| `card-tarifa-3` | Ofertas | La rejilla de tarjetas con exactamente 3. | Tres opciones o planes. | nike |
| `category-grid` | Catálogo | Rejilla de 2-8 categorías (3 por fila) con emoji o icono, título y CTA. | Un catálogo real de líneas o categorías de producto. | uax |
| `category-grid-img` | Catálogo | La rejilla de categorías con icono en imagen real. | Marcas con iconos propios. | optica2000 |
| `usp-cards` | Diferenciales | Sección con antetítulo, título, texto e insignia + 2-4 tarjetas de diferencial con icono. | Por qué elegir la marca: sus razones con respaldo. | adeslas |
| `usp-cards-sin-icono` | Diferenciales | Las tarjetas de diferencial solo con texto. | Marcas sin iconos. | adeslas |
| `usp-cards-asimetrico` | Diferenciales | Antetítulo, título con insignia al lado, cuerpo a todo el ancho y tarjetas debajo. | Igual que usp-cards con más jerarquía. | adeslas |
| `usp-cards-sin-icono-asimetrico` | Diferenciales | La versión asimétrica sin iconos. | Marcas sin iconos que quieren la versión asimétrica. | spotify |
| `trust-bar` | Confianza | 3 avales en píldoras con check (envío, garantía, atención…). | Tres avales VERIFICADOS; nunca inventados. | paraycompara |
| `trust-bar-inline` | Confianza | Los 3 avales en una línea separados por puntos, sin píldoras. | La versión discreta o editorial. | paraycompara |
| `banda-cierre` | Cierre | Banda de color oscuro de la marca con título, texto y CTA principal centrados. | El cierre: repite el CTA principal. | adeslas |
| `banda-cierre-asimetrico` | Cierre | Banda de cierre con texto a todo el ancho y el CTA alineado a la izquierda. | Cierre con ritmo menos centrado. | apple |
| `footer` | Pie | Pie con marca, lema, aviso legal, baja y preferencias. | Siempre al final (la base técnica ya trae uno: elige uno de los dos). | adeslas |
