# Structure: Para y Compara — 2026-jul-ahorra-fibra-movil

## Información general

| Campo | Valor |
|---|---|
| Cliente | Para y Compara |
| Campaña | 2026-jul-ahorra-fibra-movil |
| Total módulos | 9 |
| CTA principal | COMPARAR TARIFAS |
| Posición del CTA | Módulo 2 (Hero) + Módulo 7 (CTA intermedio) |

## Estructura visual (desktop)

```
┌─────────────────────────────────┐
│    Módulo 1 — Header            │  Logo Para & Compara
├─────────────────────────────────┤
│    Módulo 2 — Hero              │  Titular + subtítulo + CTA
├─────────────────────────────────┤
│    Módulo 3 — Servicios         │  Móvil · Fibra · Fibra+Móvil · TV
├─────────────────────────────────┤
│    Módulo 4 — 3 pasos           │  Selecciona → Compara → Elige
├─────────────────────────────────┤
│    Módulo 5 — Educativo         │  Datos · Cobertura · Paquetes · Precio
├─────────────────────────────────┤
│    Módulo 6 — Divider           │  Separador
├─────────────────────────────────┤
│    Módulo 7 — CTA final         │  "Empieza ahora" + CTA
├─────────────────────────────────┤
│    Módulo 8 — Footer            │  Texto legal + sociales
├─────────────────────────────────┤
│    Módulo 9 — LegalBlock        │  Baja, preferencias, derechos
└─────────────────────────────────┘
```

## Secuencia detallada

| Módulo | Nombre | Tipo React Email | Función | Imagen | Texto | CTA | Ritmo |
|---|---|---|---|---|---|---|---|
| 1 | Header | HeaderBlock | Abrir | Logo (placeholder) | — | No | Rápido |
| 2 | Hero | HeroBlock | Enganchar | No | Titular + subtítulo | COMPARAR TARIFAS | Normal |
| 3 | Servicios | TextBlock | Explicar | No | 4 servicios + 30 compañías | No | Normal |
| 4 | 3 pasos | TextBlock | Explicar | No | 3 pasos numerados | No | Pausado |
| 5 | Educativo | BenefitsGrid | Apoyar | No | 4 items educativos | No | Normal |
| 6 | Divider | (Hr nativo) | Separar | No | — | No | Rápido |
| 7 | CTA final | CTABlock | Actuar | No | "Empieza ahora" | COMPARAR TARIFAS | Normal |
| 8 | Footer | FooterBlock | Cerrar | Logo (placeholder) | Texto legal | Enlaces baja | Rápido |
| 9 | Legal | LegalBlock | Legal | No | Texto legal | No | Rápido |

## Comportamiento responsive

| Módulo | Desktop | Mobile | Notas |
|---|---|---|---|
| 1 | Logo izquierda/centro | Centrado | Sin cambios relevantes |
| 2 | 1 columna, texto + CTA | CTA full width | Tipografía reducida en móvil |
| 3 | Lista horizontal o viñetas | 1 columna vertical | Usar bullets |
| 4 | 3 pasos en secuencia | 1 columna | Numeración visible |
| 5 | 2 columnas (2x2) | 1 columna | Texto breve por item |
| 6 | Línea completa | Línea completa | Sin cambios |
| 7 | CTA centrado | CTA full width | Sin cambios relevantes |
| 8 | Texto centrado | Texto centrado | Sin cambios |
| 9 | Texto pequeño | Texto pequeño | Sin cambios |

## Estructura de archivos esperada

```
06-data/newsletter-data.json  — datos estructurados para la plantilla
06-data/newsletter-data.ts    — versión tipada del JSON
07-code/react-email/          — componente newsletter personalizado
```

## Riesgos estructurales

| ID | Riesgo | Severidad | Módulo |
|---|---|---|---|
| SR-01 | Sin logo ni assets visuales: módulos 1 y 8 usan placeholder | Alta | 1, 8 |
| SR-02 | Sin precios/promos confirmados: newsletter puramente informativa | Media | Todos |
| SR-03 | Sin enlaces de baja reales: módulo 9 depende de placeholders | Crítica | 9 |
| SR-04 | BenefitsGridBlock puede no tener el formato exacto de 4 items educativos | Baja | 5 |
| SR-05 | La newsletter es larga (9 módulos) puede perder usuarios antes del CTA final | Media | 7 |

## Claims prohibidos (definidos en fase de arquitectura)

Por acuerdo con el brief, estos claims NO deben aparecer en el copy:

- ❌ Cifras de ahorro concretas ("ahorra hasta X€")
- ❌ Precios de tarifas (14,50€, 18,90€, 15,50€) sin confirmación
- ❌ "Gratuito" o "free" sin confirmación
- ❌ "Garantizado" en cualquier contexto
- ❌ "Mejor", "más barato", "líder" sin evidencia
- ❌ Urgencia ("ahora", "últimas unidades", "plazo limitado")
- ❌ Exclusividad ("solo para ti")
- ❌ Sorteo iPhone 16 hasta confirmación

✅ Permitido:
- "Podrías ahorrar" (condicional)
- "Encuentra una tarifa que encaje mejor contigo"
- "Más de 30 compañías" (visible en web) — pendiente de confirmación
- Descripción del proceso de comparación