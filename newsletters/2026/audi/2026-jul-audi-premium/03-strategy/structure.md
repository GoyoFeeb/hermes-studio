# Arquitectura de Newsletter — Audi A6 Sportback e-tron

## 1. Patrón seleccionado

**`fotografia-primero`** — Audi es la marca fotografía-primero por excelencia. La fotografía lleva el peso visual absoluto de la comunicación.

## 2. Secuencia de módulos

Utilizando la gramática del patrón `fotografia-primero` (anclas + zona libre):

| # | Módulo | Componente | Fondo | Tipo |
|---|---|---|---|---|
| 1 | Header | `header-logo.html` | `#FCFCFD` | Ancla (required) |
| 2 | Hero | `hero-imagen.html` | Imagen generada | Ancla (required) |
| 3 | Manifiesto | `intro-cta.html` | `#FCFCFD` | Zona libre (optional) |
| 4 | Datos técnicos | `columns-3-beneficios-sin-icono.html` | `#F5F5F5` | Zona libre (optional) |
| 5 | Diseño exterior | `intro-cta.html` | `#FCFCFD` | Zona libre (optional) |
| 6 | Interior y experiencia | `intro-cta.html` | `#F5F5F5` | Zona libre (optional) |
| 7 | Conversión (cierre) | `banda-cierre.html` | `#101319` | Ancla (required) |
| 8 | Footer | `footer.html` | `#F5F5F5` | Ancla (required) |

### Justificación de la secuencia

La secuencia respeta el ritmo fondo+alineación+densidad del patrón:
- 1→2: cambia fondo (FCFCFD → imagen) + densidad (baja → alta)
- 2→3: cambia fondo (imagen → FCFCFD) + densidad (alta → baja)
- 3→4: cambia fondo (FCFCFD → F5F5F5)
- 4→5: cambia fondo (F5F5F5 → FCFCFD)
- 5→6: cambia fondo (FCFCFD → F5F5F5)
- 6→7: cambia fondo (F5F5F5 → 101319) + densidad (media → media-alta)
- 7→8: cambia fondo (101319 → F5F5F5) + densidad (media-alta → baja)

Ninguna sección consecutiva repite fondo+alineación+densidad. ✅

## 3. Claims prohibidos

- "Gran oferta", "No te lo pierdas", "Última oportunidad", "Sólo hoy"
- Cualquier expresión de urgencia, descuento o promoción
- "Mejor", "líder", "más barato"
- "Gratuito", "ahorro"
- Superlativos no verificables
- Precios, cuotas, financiación
- Consumo WLTP no autorizado (solo usar las cifras proporcionadas en el brief)
- Aceleración (0-100) no autorizada

## 4. Claims autorizados (verificados en audi.es)

- Hasta 773 km de autonomía WLTP
- Carga rápida de hasta 270 kW DC
- Arquitectura de batería de 800 voltios
- Motorización 100 % eléctrica
- Emisiones combinadas de CO₂: 0 g/km
- Diseño aerodinámico
- Silueta Sportback
- Faros Matrix LED (cuando aplique)

## 5. Estructura de datos por módulo

### Módulo 1: Header
- Logo: texto "AUDI" (PNG pendiente)
- Label: vacío
- Fondo: #FCFCFD

### Módulo 2: Hero (hero-imagen)
- Hero banner: imagen generada por IA
- brandName: "Audi A6 Sportback e-tron" (eyebrow)
- h1: "El progreso adopta una nueva silueta."
- subtitle: "Diseño aerodinámico, tecnología avanzada y hasta 773 km de autonomía para avanzar sin renunciar a nada."
- cta: "Solicitar oferta" → URL oficial
- ctaSecondary: "Configurar mi Audi" → URL configurador

### Módulo 3: Manifiesto (intro-cta)
- title: "Elegancia eléctrica, sin concesiones."
- body: 45-55 palabras sobre diseño Sportback + precisión + confort
- cta: "Descubrir el modelo"

### Módulo 4: Datos técnicos (columns-3-beneficios-sin-icono)
- items[0]: { title: "773 km", description: "Autonomía WLTP" }
- items[1]: { title: "270 kW", description: "Carga rápida DC" }
- items[2]: { title: "800 V", description: "Arquitectura eléctrica" }

### Módulo 5: Diseño exterior (intro-cta)
- title: "Diseñado para avanzar."
- body: Silueta Sportback, aerodinámica, proporciones
- cta: "Descubrir su diseño"

### Módulo 6: Interior y experiencia (intro-cta)
- title: "Un espacio que piensa contigo."
- body: Experiencia digital, confort, calidad percibida
- cta: "Descubrir el interior"

### Módulo 7: Conversión (banda-cierre)
- title: "Tu próximo Audi empieza aquí."
- body: "Descubre todas las posibilidades del Audi A6 Sportback e-tron y crea una configuración a tu medida."
- cta: "Configurar mi Audi"
- ctaSecondary: "Solicitar oferta personalizada"

### Módulo 8: Footer
- tagline: "Audi"
- disclosure: Texto legal con emisiones WLTP
- unsubscribeUrl: [UNSUBSCRIBE_LINK]
- preferencesUrl: [PREFERENCES_LINK]
