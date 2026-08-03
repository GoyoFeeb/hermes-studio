# Visual QA: New Balance — new-balance-premium

## Checklist visual

| Aspecto | Estado | Nota |
|---|---|---|
| Header | ✅ | Logo NB + tagline "New Balance". Fondo blanco. Separador sutil #E0E0E0 |
| Hero | ✅ | Banner imagen + gradiente oscuro (#231F20→#151415). H1 "The Running Collection" en blanco. CTA negro #151415 |
| Editorial 1 | ✅ | Foto izq (46%) + texto der (54%). Eyebrow "NUEVOS COLORES". Título serif "Mismo espíritu." |
| Editorial 2 | ✅ | Texto izq (54%) + foto der (46%). Eyebrow "120 AÑOS DE HERENCIA". Título serif "Hecho para durar." |
| Valores marca | ✅ | 3 columnas sin icono. Fondo #F2F2F3. Título "Tres pilares de New Balance." |
| Banda cierre | ✅ | Fondo oscuro #231F20. Título "We're In It For The Long Run." CTA blanco sobre oscuro |
| Footer | ✅ | Fondo #F5F5F5. Tagline "We're In It For The Long Run." Enlaces legales |
| Responsive | ✅ | Media query 599px. Stack vertical para editoriales. Imágenes fluidas |
| Outlook | ✅ | VML para CTAs. MSO conditional. Table-based layout |
| Accesibilidad | ✅ | Alt text en todas las imágenes. Relación de contraste >4.5:1 en todos los pares |

## Peso

| Archivo | Tamaño |
|---|---|
| final.html (fuente) | 23.3 KB |
| final-inline.html | 22.3 KB |

## Observaciones

- La newsletter utiliza el patrón `fotografia-primero` con 7 módulos
- Sin iconos decorativos — consistente con la identidad de New Balance
- Tipografía: Arial/Helvetica para cuerpo, Georgia para titulares editoriales (serif)
- Paleta: blanco, casi-negro #151415, rojo acento #CF0A2C
- Todos los contrastes WCAG pasan sin ajustes artificiales
- CTA negro #151415 sobre blanco: 18.38:1 — muy por encima del umbral
