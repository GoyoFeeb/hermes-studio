# Theming Guide — Newsletter Multibrand System

> Versión 2.0
> Cómo funciona el sistema de temas multimarca.

---

## Arquitectura

```
newsletter-system/
├── core/          ← Agnóstico de marca (estructural, técnico)
├── campaigns/     ← Patrones de campaña universales
├── brands/        ← Temas específicos por marca
│   ├── _template/ ← Plantilla para crear nuevas marcas
│   ├── paraycompara/
│   └── demo/
├── examples/      ← Ejemplos de uso
├── previews/      ← Capturas de preview
└── docs/          ← Documentación
```

## Cómo funciona el theming

1. **Core** define la estructura técnica: tablas, VML, responsive, breakpoints, placeholders
2. **Brand pack** define la identidad visual: colores, logo, CTA, voice
3. **Campaign patterns** definen la estructura de contenido: hero + cards + CTA
4. **Brand campaign** = Campaign pattern + Brand pack

El core no contiene ningún valor de Para y Compara. Los valores de marca viven exclusivamente en `brands/<marca>/tokens/brand-tokens.json`.

## Flujo de render

```
brand-tokens.json  ──aplica──>  campaign base  ──genera──>  HTML final
        ↑
  core-tokens.json (base técnica)
```

## Separación de responsabilidades

| Capa | Contiene | No contiene |
|---|---|---|
| Core | Tablas, VML, responsive, placeholders | Colores, logos, copy |
| Brand | Colores, logo, voice, CTA | Estructura técnica |
| Campaign | Estructura de contenido | Valores de marca |
| Brand campaign | Todo combinado | — |