# compatibility-matrix-v3.md

> Campaña: 2026-jul-ahorra-fibra-movil — V3 Premium
> Fecha: 2026-07-13

---

## Leyenda

| Símbolo | Significado |
|---|---|
| ✅ | Soporte completo |
| ⚠️ | Soporte parcial / fallback funciona |
| ❌ | No compatible / no se renderiza |
| — | No aplica |

---

## Matriz de compatibilidad

| Componente | Gmail Web | Gmail Android | Gmail iOS | Apple Mail macOS | Apple Mail iOS | Outlook Web | Outlook Windows | Outlook Móvil | Yahoo Mail | Samsung Mail |
|---|---|---|---|---|---|---|---|---|---|---|
| **Layout tablas** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **600px max-width** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Media queries** | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ |
| **Hero image (CDN)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GIF animado** | ⚠️¹ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| **Poster estático** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Border-radius cards** | ⚠️² | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ |
| **Border-radius CTA** | ⚠️² | ⚠️ | ⚠️ | ✅ | ✅ | ✅³ | ✅³ | ✅³ | ⚠️ | ✅ |
| **VML bulletproof** | — | — | — | — | — | ✅ | ✅ | ✅ | — | — |
| **Fuentes Arial** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Colores de fondo** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Padding en celdas** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Imágenes display:block** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Alt text** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Enlaces subrayados** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modo oscuro** | ⚠️⁴ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

**Notas:**
1. Gmail no reproduce GIF automáticamente en todas las versiones; necesita clic en "Mostrar imágenes"
2. Gmail no soporta border-radius en imágenes ni en td — se pierde el redondeo pero el layout sigue siendo funcional
3. Outlook con VML: el `v:roundrect` garantiza botones redondeados incluso donde CSS border-radius no funciona
4. Modo oscuro: sin meta color-scheme, los clientes pueden invertir colores automáticamente. El diseño usa fondos claros + texto oscuro, por lo que la inversión mantiene legibilidad

---

## Verificación real vs esperada

| Cliente | Método de verificación |
|---|---|
| Todos | ✅ Compatibilidad esperada por construcción (HTML email table-based, inline styles, CDN assets) |
| Ninguno | ❌ Verificación mediante render real en el cliente (requiere Litmus/Email on Acid) |

**Todas las afirmaciones de esta matriz están basadas en documentación pública de CSS compatibility in email (Can I Email, Campaign Monitor).**