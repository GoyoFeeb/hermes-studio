# Roadmap — QA visual real (Fase E) — 2026-07-28

**Estado: scoping, no ejecutado.** Ver `docs/implementacion-auditoria-tecnica-2026-07-28.md` §6 —
esta pieza se dejó fuera de la implementación de Fases A-D porque requiere infraestructura de
captura/comparación visual que hoy no existe como sistema, no un script puntual.

## Qué existe hoy

- `scripts/preview-html.ts` (`npm run preview-html`) genera una captura PNG puntual de un HTML ya
  exportado, con Playwright/Chromium. Es una herramienta de inspección manual, no de QA automatizado
  — no compara contra nada, solo produce una imagen para que un humano la mire.
- `agents/08-qa-specialist.md` exige render obligatorio en 4 resoluciones como criterio de cierre no
  negociable ("no lo pude renderizar" es bloqueo) — pero esa verificación la hace el agente
  mirando manualmente, no un gate automatizado.
- `docs/qa-process.md` documenta el proceso deseado (QA visual, QA responsive, con listas de
  verificación) pero **sigue nombrando al agente 07 "React Email Developer"**, su nombre bajo el
  pipeline archivado — no se corrigió en Fase B porque el árbol auditado fue
  `pipeline-skill/references/`, no `docs/`; queda como próxima oportunidad de alcance idéntico.
- Ningún gate del Production Gate compara un render actual contra un baseline. Gate 5 (assets)
  solo verifica que las URLs de imágenes devuelven HTTP 200 — no que la imagen en sí sea correcta.

## Qué falta para "QA visual real" (detección automática, no solo captura)

1. **Baseline por campaña/marca.** Un render de referencia aprobado humanamente, versionado
   (probablemente PNG por breakpoint, o un hash perceptual en vez de exacto — un PNG cambia de
   hash con cualquier diferencia de 1px, lo cual generaría falsos positivos constantes en un
   sistema con contenido de campaña que cambia cada vez).
2. **Diffing perceptual, no exacto.** Comparar dos PNG byte a byte falla ante cualquier cambio de
   copy real (que es esperado, cambia cada campaña) — se necesita una librería de diff de imagen con
   umbral (ej. resemblejs, pixelmatch con % de tolerancia) que distinga "cambió el texto de un CTA"
   (esperado) de "el CTA se desbordó de su contenedor" (bug real).
3. **Multi-breakpoint, multi-cliente de email.** El propio `docs/qa-process.md` ya define desktop
   (600px) y mobile (320-480px) como los dos targets — la infraestructura de captura tendría que
   generar ambos por campaña. Renderizado real en Outlook/Gmail/Apple Mail (no solo Chromium)
   requeriría un servicio externo tipo Litmus/Email on Acid — decisión de producto/coste, no solo
   ingeniería.
4. **Gate automatizado** que bloquee si el diff perceptual supera el umbral, con override humano
   documentado (igual que `check-hero-decision.ts`/`check-structural-differentiation.ts` ya aceptan
   una justificación escrita como salida válida, no solo un PASS/FAIL binario).
5. **Almacenamiento de baselines.** Decisión de dónde viven los PNG de referencia — git LFS,
   almacenamiento externo, o regenerar el baseline en cada aprobación humana explícita
   (`campaign-status: approved` → captura actual se convierte en el nuevo baseline).

## Por qué no se construyó en esta pasada

- Es un proyecto en sí mismo (estimación: no cabe en "riesgo bajo, mecánico" como el resto de
  Fase D — necesita decisiones de producto: ¿qué servicio de renderizado externo, si alguno? ¿qué
  umbral de diff es aceptable? ¿quién aprueba el primer baseline de cada marca?).
- Construirlo sin esas decisiones tomadas produciría exactamente el tipo de trabajo especulativo
  que la propia auditoría señaló como bien evitado en el resto del sistema (Fase E de la auditoría
  original: "no acelerar sin necesidad real").
- No hay evidencia hoy de que el QA manual actual (agente 08, 4 resoluciones, checklist) esté
  fallando en producción — es lento pero no hay incidente documentado de un bug visual que haya
  llegado a un cliente por falta de este sistema.

## Cuándo construirlo

Si aparece un incidente real de render roto que llegó a producción pese al QA manual (el mismo
patrón que ya justificó Gate 11/Gate 12: incidente documentado → gate automatizado con dueño), o si
el volumen de campañas crece lo suficiente para que el QA manual de 4 resoluciones por campaña se
vuelva el cuello de botella real del pipeline — en ese punto, empezar por el punto 1-2 de arriba
(baseline + diff perceptual en Chromium/Playwright, que ya está instalado) antes que por el punto 3
(clientes de email reales, que implica coste externo).

## Corrección de bajo esfuerzo pendiente, no bloqueada por lo anterior

`docs/qa-process.md` nombrando al agente 07 como "React Email Developer" es el mismo tipo de fix
mecánico que Fase B ya aplicó a 7 archivos de `pipeline-skill/references/` — no requiere ninguna de
las decisiones de producto de arriba, solo no se auditó en ese árbol. Candidato directo para la
próxima pasada de mantenimiento documental.
