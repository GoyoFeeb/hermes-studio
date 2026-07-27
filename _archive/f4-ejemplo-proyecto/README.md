# Ejemplo: Proyecto Demo

> Proyecto de demostración del **Hermes Newsletter System** con marca ficticia **DemoCorp**.

## Estructura

```
ejemplo-proyecto/
├── newsletters/2026/demo/2026-jul-lanzamiento/
│   ├── 00-brief/    — brief de ejemplo
│   ├── 02-analysis/ — análisis de marca ficticia
│   ├── ... (fases 00-09)
│   └── README.md
└── README.md        ← este archivo
```

## Cómo usar este ejemplo

```bash
cd ejemplo-proyecto
npm install
npm run create-campaign -- --year 2026 --client demo --campaign 2026-jul-lanzamiento --force
npm run validate-newsletter -- --campaign newsletters/2026/demo/2026-jul-lanzamiento
```

## Marca ficticia

| Atributo | Valor |
|----------|-------|
| Nombre | DemoCorp S.L. |
| Color primario | `#2563EB` (blue-600) |
| Color secundario | `#1E40AF` (blue-800) |
| Fuente | Inter, Arial, sans-serif |
| Tono | Profesional, cercano |

> Todos los datos de este proyecto son ficticios. No incluye secretos, clientes reales ni datos sensibles.