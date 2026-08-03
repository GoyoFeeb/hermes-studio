# Module Selection — Nike Air Force One Relanzamiento

## Patrón elegido: `fotografia-primero`

### Criterios de selección (fotografia-primero.md §6)

| # | Criterio | Brand pack Nike | Resultado |
|---|---|---|---|
| 1 | photography.usesRealPhotography: true | `true` + treatment "fotografía real de alta calidad como elemento visual dominante" | ✅ Cumple |
| 2 | iconography.componentImplication desaconseja iconos | "NO usar emoji (iconGlyph)... Nike es demasiado aspiracional para emojis" | ✅ Cumple |
| 3 | layout.contentRhythm: fotografía domina, texto breve | "fotografía domina absolutamente. Texto mínimo, seguro, directo" | ✅ Cumple |
| 4 | Sin cifras de ahorro/comparación | No hay cifras de ahorro en el brief | ✅ No es saving |
| 5 | Sin catálogo/grid de categorías | No hay catálogo de 2-8 categorías en el brief | ✅ No es institutional |

**Conclusión: `fotografia-primero` es el patrón correcto.**

## Módulos seleccionados

| # | Módulo | Tipo | Obligatorio | Función narrativa |
|---|---|---|---|---|
| 1 | header-logo | Cabecera | Sí | Identidad Nike |
| 2 | hero-imagen | Hero | Sí (patrón) | Impacto visual del producto + H1 + CTA descubrimiento |
| 3 | intro-cta | Transición | Opcional | Origen del AF1 (1982, primera zapatilla con Nike Air) en 1 párrafo breve |
| 4 | editorial-foto-texto | Editorial | Opcional | Detalle del diseño: silueta, materiales (cuero, goma, Nike Air) |
| 5 | columns-3-beneficios-sin-icono | Beneficios sin icono | Opcional | 3 razones de su permanencia: legado cultural, diseño atemporal, versatilidad |
| 6 | banda-cierre | Cierre | Sí | CTA final "Explorar colores" / "Comprar" |
| 7 | footer | Pie | Sí | Datos legales |

### Justificación de omisiones
- **intro-cta y editorial-foto-texto vs repetir intro-cta:** Se usa intro-cta para el contexto histórico breve + editorial-foto-texto para el detalle de diseño. No se repite la misma composición. La página real de AF1 tiene fotos de detalle del producto (materiales, textura del cuero, suela) que justifican un bloque editorial foto+texto en vez de solo texto.
- **Sin metric-strip-premium:** AF1 no es un producto técnico automotriz/deportivo con métricas cuantitativas (kW, km/h). Las cualidades del AF1 son culturales y de diseño, no métricas.
