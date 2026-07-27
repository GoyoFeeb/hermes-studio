# PROMPT 07 — Integrar los iconos oficiales de paraycompara.com

## CONTEXTO

Eres el Orchestrator de Hermes. La propuesta de iconos generada en la ronda 04
(`rondas/assets/iconos-propuesta/`) fue **rechazada por el usuario**: quiere los iconos
oficiales de la web del cliente. Márcala como rechazada (no la borres — histórico).

La web oficial tiene los assets originales en SVG. Inventario verificado
(2026-07-17, portada de `https://paraycompara.com/`):

| Uso en la newsletter | Asset oficial | URL |
|---|---|---|
| Tarjeta Móvil | `tarifa-movil-icon.svg` | `https://paraycompara.com/assets/img/tarifa-movil-icon.svg` |
| Tarjeta Fibra | `tarifa-fibra-icon.svg` | `https://paraycompara.com/assets/img/tarifa-fibra-icon.svg` |
| Tarjeta Fibra+Móvil | `tarifa-fibra-movil-icon.svg` | `https://paraycompara.com/assets/img/tarifa-fibra-movil-icon.svg` |
| Tarjeta Televisión | `tarifa-tv-icon.svg` | `https://paraycompara.com/assets/img/tarifa-tv-icon.svg` |
| Lista "Antes de decidir" ítem 1 (datos) | `aspecto1.svg` | `https://paraycompara.com/assets/img/aspecto1.svg` |
| Ítem 2 (cobertura) | `aspecto2.svg` | `https://paraycompara.com/assets/img/aspecto2.svg` |
| Ítem 3 (paquetes) | `aspecto3.svg` | `https://paraycompara.com/assets/img/aspecto3.svg` |
| Ítem 4 (condiciones) | `aspecto4.svg` | `https://paraycompara.com/assets/img/aspecto4.svg` |
| (Futuro dark mode) | `icon-movil-white.svg`, `icon-fibra-white.svg`, `icon-tv-white.svg` | mismo directorio |
| (Opcional pasos 1-3) | `punto1.svg`, `punto2.svg`, `punto3.svg` | mismo directorio |

Nota: los PNGs actuales de la newsletter (`tarifa-*-icon.png` en el CDN feebbodigital)
ya derivan de estos SVGs — el problema de pesos/trazos desiguales viene de aquella
conversión. Esta ronda la rehace bien desde el origen.

## TAREAS

1. **Descargar** los SVGs oficiales (los 8 principales + los 3 white para archivo).
   Guárdalos en `01-inputs/images/oficiales/` (fase 01 del pipeline — son inputs del cliente).
2. **Convertir a PNG para email** (los clientes de correo no soportan SVG):
   - Tarifa: render a 96×96 (@2x de 48px de uso).
   - Aspectos: render a 72×72 (@2x de 36px — el tamaño del badge actual de la lista).
   - Fondo transparente, sin recomprimir con pérdida; objetivo < 8 KB por PNG.
   - Verifica que los 8 comparten trazo/estilo entre sí (son de la misma familia
     oficial — si alguno desentona, documenta y pregunta antes de integrar).
3. **Publicar** los PNGs en la ruta de assets de la campaña (mismo CDN/flujo que los
   actuales; si no tienes acceso de subida, déjalos en `09-exports/assets/` con las
   rutas finales documentadas en `ASSETS_PRODUCCION.md` para subida manual).
4. **Integrar en la pieza**:
   - Sustituir los `src` de los 4 iconos de tarjeta por los nuevos PNGs.
   - En "Antes de decidir": sustituir el check tipográfico (✓) de cada ítem por su
     icono `aspecto{n}` correspondiente (mismo tamaño de badge actual, `alt=""`
     decorativo — el título del ítem ya comunica el significado). Mantén el círculo
     de fondo solo si el icono lo necesita para contraste; si el SVG ya trae su propio
     contenedor visual, evalúalo sobre la captura.
   - Trust bar: mantiene sus checks ✓ (no hay icono oficial de check; coherente).
   - Pasos 01/02/03: NO sustituir por punto1-3 sin ver cómo se ven — genera una captura
     comparativa y decide, documentando el porqué.
5. **Verificación visual obligatoria**: capturas 320/375/600 + 600-dark antes/después,
   revisadas por ti. Los iconos deben verse nítidos (@2x real, sin escalado borroso).
6. **Actualizar** `icon-system-spec.md` (el set oficial sustituye a la spec de encargo;
   las variantes white quedan registradas como base del futuro dark mode),
   `design-tokens-premium.json`, qa-report, comparison y los 4 archivos de control.

## RESTRICCIONES

- Los SVG originales no se modifican (solo se convierten). Nada de redibujar.
- No tocar composición, copy ni nada fuera de los `src`/badges indicados.
- Dimensiones explícitas width/height en todos los `<img>` nuevos.
- HTTP 200 verificado para cada asset final antes de cerrar.
- Inline regenerado con juice; paridad fuente/inline verificada.

## CRITERIOS DE ACEPTACIÓN

- [ ] 8 SVGs oficiales archivados en `01-inputs/images/oficiales/` + 3 white
- [ ] 8 PNGs @2x generados, < 8 KB, pesos homogéneos (rango < 1.5x entre menor y mayor)
- [ ] 4 tarjetas + 4 ítems de lista con iconos oficiales integrados
- [ ] Capturas antes/después revisadas; iconos nítidos a 320 y 600
- [ ] Propuesta de la ronda 04 marcada como rechazada en su qa-report
- [ ] Documentación y control files al día (que no se repita lo de la auditoría)
