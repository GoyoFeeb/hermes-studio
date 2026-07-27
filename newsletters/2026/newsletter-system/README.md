# Newsletter Multibrand System

> Sistema universal de newsletters multimarca v2.0
> Core agnóstico + brand packs intercambiables

---

## Arquitectura

```
newsletter-system/
├── core/              ← Técnica universal (sin marca)
│   ├── tokens/
│   ├── components/
│   ├── responsive/
│   ├── compatibility/
│   ├── accessibility/
│   ├── animation/
│   └── qa/
├── campaigns/         ← Patrones de campaña universales
├── brands/            ← Temas de marca intercambiables
│   ├── _template/     ← Plantilla para nuevas marcas
│   ├── paraycompara/  ← Primer brand pack real
│   └── demo/          ← Brand pack de demostración
├── examples/
├── previews/
├── docs/
└── README.md
```

## Principios

1. **Core sin marca** — Sin colores, logos ni copy de ninguna marca
2. **Brand packs autocontenidos** — Cada marca tiene su identidad
3. **Patrones universales** — Las campañas no dependen de la marca
4. **Intercambiables** — Cambiar de marca no requiere reescribir HTML

## Marcas disponibles

| Marca | Tokens | Ejemplos | Estado |
|---|---|---|---|
| Para y Compara | ✅ | 4 campañas | ✅ Producción |
| Demo | ✅ | 1 campaña | ✅ Demostración |

## Cómo empezar

1. Ver `docs/guides/create-new-brand.md` para añadir una nueva marca
2. Ver `docs/guides/create-new-campaign.md` para crear una campaña
3. Ver `docs/guides/theming-guide.md` para entender la arquitectura

## Quick start

```bash
# 1. Generar inline para una campaña
node -e "
const j=require('juice').default||require('juice');
const fs=require('fs');
fs.writeFileSync('output-inline.html',j(fs.readFileSync('input.html','utf-8')));
"

# 2. Probar responsive
# Abrir HTML en navegador y redimensionar a 600, 390 y 320px

# 3. Verificar VML en botones
grep 'v:roundrect' input.html
```

## Componentes core

Ver `core/components/component-gallery.html` — 6 componentes estructurales sin marca.

## Validación

- Sistema probado con 2 marcas (Para y Compara + Demo)
- Ambas usan colores, logos y CTAs distintos
- El core no contiene valores de ninguna marca
- Las previews demuestran independencia

## Qué sistema es el vigente

- **`newsletter-system/`** es la referencia para patrones multibrand en HTML puro.
- **`react-email-template/`** es el pipeline de 10 agentes.
- **`brand-library/_template/`** queda como referencia conceptual, sin mecanismo activo que la consuma.