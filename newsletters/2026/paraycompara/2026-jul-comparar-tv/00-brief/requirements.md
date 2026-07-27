# Requirements — 2026-jul-comparar-tv

## Legales
- Footer con enlaces de baja y preferencias (merge-tags de ESP hasta datos reales del cliente).
- Línea legal con copyright + dirección física (placeholder permitido SOLO con isTestCampaign:true).
- Línea de disclosure: "Recibes este correo porque te registraste en Para y Compara."

## Comerciales
- Prohibido inventar precios, promociones o claims de cobertura deportiva específica.
- Copy de catálogo/pasos/trust reutilizado literal de la pieza validada donde aplique.
- Todos los enlaces comerciales con UTM (source=newsletter, medium=email, campaign=2026-jul-comparar-tv, content por módulo).

## Técnicos
- Motor: engine/build-newsletter.js, patrón "saving", brand pack v2.2.2 (>= 2.2.0 exigido por el motor).
- Iconos: solo los 8 PNGs ya en CDN. Sin assets nuevos.
- Peso inline < 90 KB (aviso >= 80 KB).
