# Requirements: Para y Compara — 2026-jul-ahorra-fibra-movil

## Requisitos legales

**[PENDIENTE DE CONFIRMACIÓN]** — No se dispone de textos legales aprobados por el cliente.

### Cláusulas copiadas textualmente

> Pendiente de recibir del cliente: enlace de baja, enlace de preferencias, política de privacidad, aviso legal.

Fuente: [PENDIENTE — solicitar al cliente]

## Requisitos comerciales

| Concepto | Detalle | Fuente | Estado |
|---|---|---|---|
| Precio/s | Varios visibles en web (14,50€, 18,90€, 15,50€) | paraycompara.com | **[NO USAR EN NEWSLETTER]** — pendiente confirmación |
| Descuento | No hay descuento específico confirmado | — | N/A |
| Promoción | Sorteo iPhone 16 con uso del comparador | Modal web oficial (Jul 2026) | **[PENDIENTE DE CONFIRMACIÓN]** |
| Fecha inicio | 2026-07-09 | Input usuario | Confirmado |
| Fecha fin | No especificada | — | **[PENDIENTE DE CONFIRMACIÓN]** |
| Condiciones | Pendientes de recibir | — | **[PENDIENTE]** |

## Requisitos técnicos

- Renderizado React Email con componentes existentes del sistema
- CSS inline para compatibilidad con clientes de email (--inline mode)
- Sin JavaScript
- Sin formularios embebidos (el CTA redirige al comparador externo)
- El enlace principal debe apuntar a https://paraycompara.com/
- Alt text descriptivo en todas las imágenes

## Restricciones

- No inventar precios, promociones, operadoras, descuentos, condiciones ni cifras
- No utilizar el sorteo del iPhone 16 hasta confirmación explícita del cliente
- No utilizar referencias temporales antiguas
- Marcar como `[PENDIENTE DE CONFIRMACIÓN]` cualquier claim comercial dudoso
- Campaña de prueba interna: no marcar como producción hasta resolver bloqueos