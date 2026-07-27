# Outlook QA — 2026-jul-comparar-tv

| Comprobación | Resultado |
|---|---|
| VML roundrect en los 2 CTAs (4 ocurrencias v:roundrect, 2 por CTA) | ✅ (conteo del build-manifest, verificado por lib/verify.js y check-parity) |
| Condicionales <!--[if mso]> presentes (shell + CTAs, byte a byte del componente validado) | ✅ |
| Layout 100% tablas, sin flexbox/grid | ✅ (por construcción — componentes del motor) |
| Verificación en Outlook/Litmus real | ⚠️ SIN ACCESO en este entorno — misma limitación documentada en todas las campañas anteriores. Advertencia, no aprobación fingida. |
