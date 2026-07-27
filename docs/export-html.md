# Export HTML — Script de renderizado a HTML

## Objetivo

Renderizar una newsletter React Email a HTML final listo para email marketing, generando los archivos en `09-exports/` de la campaña.

## Dependencias requeridas

El script necesita estos paquetes npm instalados en el proyecto:

| Paquete | Versión recomendada | Propósito |
|---|---|---|
| `react` | ^18 o ^19 | Base de React Email |
| `react-dom` | ^18 o ^19 | Renderizado HTML |
| `@react-email/components` | ^0.0.x | Componentes email (Section, Row, Heading, etc.) |
| `@react-email/render` | ^0.0.x | Renderizado a HTML string |
| `typescript` | ^5.x | Compilación TSX |
| `tsx` | ^4.x | Ejecución TypeScript |

Para inline de estilos (opcional, con `--inline`):

| Paquete | Propósito |
|---|---|
| `juice` | Inline de estilos CSS a HTML |

### Instalación

```bash
cd /Users/javi/hermes-newsletter-system
npm install react react-dom @react-email/components @react-email/render typescript tsx
```

Si se necesita inline:

```bash
npm install juice
```

## Uso

### Comando básico

```bash
npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman
```

### Ruta absoluta

```bash
npm run export-html -- \
  --campaign /Users/javi/hermes-newsletter-system/newsletters/2026/ocu/2026-jul-moneyman
```

### Opciones

| Flag | Descripción |
|---|---|
| `--campaign` | (Obligatorio) Ruta a la carpeta de la campaña |
| `--force` | (Opcional) Sobrescribe `final.html` si ya existe |
| `--inline` | (Opcional) Genera también `final-inline.html` con estilos inline |

### Ejemplo completo

```bash
npm run export-html -- \
  --campaign newsletters/2026/ocu/2026-jul-moneyman \
  --inline \
  --force
```

## Archivos generados

El script escribe dentro de `{campaign}/09-exports/`:

| Archivo | Condición |
|---|---|
| `final.html` | Siempre se genera (si las dependencias están instaladas) |
| `final-inline.html` | Solo si se pasa `--inline` y `juice` está instalado |

## Flujo de trabajo esperado

```
1. Desarrollar newsletter con React Email (agente 07)
2. Validar con QA (agente 08)
3. Ejecutar export-html:
   npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman --inline
4. Subir final.html o final-inline.html a la plataforma de email marketing
```

## Limitaciones actuales

- No genera `final-preview.png` (requiere Puppeteer/Playwright)
- No empaqueta assets automáticamente
- No sube a plataformas de email marketing (Doctorsender, Mailchimp, etc.)
- No añade parámetros UTM
- El inline requiere `juice` instalado

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| "Faltan dependencias" | No están instalados los paquetes npm necesarios | `npm install react react-dom @react-email/components @react-email/render typescript tsx` |
| "Ya existe final.html" | El archivo ya existe y no se usó `--force` | Añadir `--force` o borrar manualmente |
| "No se encuentra 06-data/..." | La campaña no tiene estructura completa | Ejecutar `validate-newsletter` primero |
| "No se encuentra 07-code/..." | React Email no está preparado en la campaña | Ejecutar `prepare-react-email` primero |
| Error al renderizar | Error en el componente React Email | Revisar el código TSX del componente |

## Advertencias

- **No envía emails.** Este script solo genera archivos HTML locales.
- **No convierte una campaña de prueba en producción.** Solo genera el HTML. La decisión de producción corresponde al flujo completo 00→09.
- **Requiere validación manual** del HTML generado en clientes reales (Outlook, Gmail, mobile) antes de enviar a usuarios.
- **No modifica newsletter-data.json** ni los componentes React Email de la campaña.

## Scripts relacionados

| Script | Propósito |
|---|---|
| `prepare-react-email` | Copiar plantilla React Email base a una campaña |
| `validate-newsletter` | Validar estructura de campaña |
| `check-links` | Validar enlaces offline |
