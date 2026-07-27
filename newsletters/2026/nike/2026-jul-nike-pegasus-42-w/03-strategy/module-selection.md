# Module Selection

## Patrón elegido: `fotografia-primero`

### Motivo (verificación contra los 5 criterios de fotografia-primero.md §6)

| # | Criterio | Brand pack de Nike | ¿Cumple? |
|---|---|---|---|
| 1 | `photography.usesRealPhotography: true` y treatment describe fotografía como protagonista | ✅ `usesRealPhotography: true`, treatment: "fotografía real de alta calidad como elemento visual dominante" | ✅ |
| 2 | `iconography.componentImplication` desaconseja iconos/emoji | ✅ `componentImplication`: "NO usar emoji (iconGlyph) en ningún módulo — Nike es demasiado aspiracional para emojis" | ✅ |
| 3 | `layout.contentRhythm` documenta fotografía con texto breve | ✅ "fotografía domina absolutamente. Texto mínimo, seguro, directo" | ✅ |
| 4 | Ninguna cifra de ahorro/comparación que justifique `saving.md` | ✅ Sin cifras de ahorro. El producto se vende a precio de mercado. | ✅ |
| 5 | Ningún catálogo/grid de categorías que justifique `institutional` | ✅ Sin categorías/listado de productos. Un solo producto. | ✅ |

**Conclusión: `fotografia-primero` es el único patrón que encaja.**

## Secuencia de módulos

Basada en fotografia-primero.md §1, con decisión sobre los opcionales:

| # | Componente | Obligatorio | Decisión | Motivo |
|---|---|---|---|---|
| — | `_shell.html` | Siempre | ✅ Incluido | Envoltorio del motor |
| 1 | `header-logo.html` | Sí | ✅ Incluido | Logo Nike swoosh. Pendiente URL real → usar placeholder HTTPS |
| 2 | `hero-imagen.html` | Sí (sin alternativa en este patrón) | ✅ Incluido | El arte del hero se genera con `npm run generate-hero-image` |
| 3 | `intro-cta.html` | Opcional | ❌ **Omitido** | No hay un párrafo de transición real entre hero y beneficios — la regla del patrón dice "no se rellena para ocupar espacio" |
| 4 | `columns-3-beneficios-sin-icono.html` | Opcional | ✅ **Incluido** | Hay 3 beneficios reales del producto extraídos del copy oficial de Nike |
| 5 | `banda-cierre.html` o `-asimetrico.html` | Sí | ✅ `banda-cierre.html` | `layout.sectionStyle: "centrado"` — usar variante centrada |
| 6 | `footer.html` | Siempre | ✅ Incluido | Placeholders legales (isTestCampaign:true) |

### Decisión hero

`hero-imagen` es la única opción válida para `fotografia-primero`. El arte se genera mediante:
```bash
npm run generate-hero-image -- --brand nike --theme "Nike Pegasus 42 para mujer. Máxima respuesta en cada zancada con la misma tecnología que energiza a un icono." --campaign newsletters/2026/nike/2026-jul-nike-pegasus-42-w --source landing --url https://www.nike.com/t/pegasus-42-womens-road-running-shoes-VCB6baKU/IB1881-602
```
Requiere OPENAI_API_KEY con facturación activa.
