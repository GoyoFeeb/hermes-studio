# Release Notes v1.0 — Para y Compara Email Design System

> Fecha: 2026-07-13

---

## Novedades

### Sistema completo de newsletters

Primera versión del sistema visual reutilizable para todas las newsletters de Para y Compara.

### Incluye

| Componente | Archivos |
|---|---|
| Tokens de diseño | 4 archivos (color, tipografía, espaciado, JSON) |
| Componentes HTML | 20 componentes en galería + 8 subdirectorios |
| Plantillas de campaña | 4 familias (saving, educational, comparison, retargeting) |
| Guías de uso | 7 guías (voz, assets, iconos, animación, responsive, compatibilidad, QA) |
| Previews | 6 capturas (600, 390, 320px) |
| README + guías de uso | 3 archivos de documentación |

### Novedades técnicas

- Botones bulletproof con VML para Outlook
- Responsive hasta 320px testado con Playwright
- Sistema de tokens centralizado en JSON
- Placeholders de asset documentados y localizables
- Sin dependencias externas (Google Fonts, JavaScript)

---

## Archivos del sistema (35)

```
paraycompara-email-system/
├── README.md
├── tokens/ (4)
├── components/ (1 galería + 8 componentes)
├── campaigns/ (4 familias × 2 versiones = 8 HTMLs)
├── guidelines/ (7)
├── previews/ (6)
├── system-audit-final.md
├── inconsistencies-found.md
├── system-usage-guide.md
└── release-notes-v1.md
```

---

## Problemas conocidos

1. **Hero URL no existe en CDN** — `hero-paraycompara-v4.png` debe subirse al CDN
2. **Código React Email residual** — `data-id="__react-email-column"` en saving inline (no afecta funcionalidad)
3. **Campaign saving no es inline-puro** — Hereda estilos del sistema V4.1; funcional pero no tan limpia como las otras 3

---

## Próximos pasos recomendados

1. Subir `hero-paraycompara-v4.png` al CDN
2. Limpiar código residual de saving inline
3. Añadir variante de hero con imagen para educational y retargeting
4. Probar en Litmus o Email on Acid para verificación multi-cliente real

---

## Agradecimientos

Sistema construido siguiendo los principios de:
- Email HTML table-based layout
- WCAG AA para accesibilidad
- Bulletproof buttons (Campaign Monitor methodology)
- Juice inline CSS
- Playwright para testing visual automatizado