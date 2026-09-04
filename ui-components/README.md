# Alma IA - UI Components

Componentes React para ChatGPT Apps SDK con el estilo visual de Alma IA.

## 🎨 Componentes

1. **TriageCard** - Orientación de síntomas con banderas rojas
2. **HydrationPlan** - Plan de hidratación interactivo con checkboxes
3. **PostureChecklist** - Lista de pausas ergonómicas
4. **StretchesTimer** - Temporizador de 5 minutos con pasos guiados

## 🚀 Desarrollo

### Instalar dependencias

```bash
cd ui-components
npm install
```

### Modo desarrollo

```bash
npm run dev
```

Abre http://localhost:5173/triage.html (o hydration.html, posture.html, stretches.html)

### Build para producción

```bash
npm run build
```

Genera archivos en `dist/` listos para servir desde Express.

## 📦 Integración con Backend

Los componentes se sirven desde el backend Express:

```
GET /api/v1/chatgpt/ui/triage?data={...}
GET /api/v1/chatgpt/ui/hydration?data={...}
GET /api/v1/chatgpt/ui/posture?data={...}
GET /api/v1/chatgpt/ui/stretches?data={...}
```

Los endpoints POST ahora incluyen `componentUrl` en la respuesta:

```json
{
  "data": { ... },
  "html": "<div>...</div>",
  "componentUrl": "https://api-almaia-prod.onrender.com/api/v1/chatgpt/ui/triage?data=..."
}
```

## 🎨 Paleta de Colores Alma IA

- **Primary Blue**: `#2196F3`, `#4A80F0`, `#4A90E2`
- **Sky Blue**: `#87CEEB`, `#A9D4FB`, `#B0E0E6`
- **Alert Red**: `#FF4757`
- **Success Green**: `#4CAF50`
- **White overlays**: `rgba(255, 255, 255, 0.3)`

## 📁 Estructura

```
ui-components/
├── src/
│   ├── components/
│   │   ├── TriageCard.tsx
│   │   ├── HydrationPlan.tsx
│   │   ├── PostureChecklist.tsx
│   │   └── StretchesTimer.tsx
│   ├── styles/
│   │   └── global.css
│   ├── triage.tsx
│   ├── hydration.tsx
│   ├── posture.tsx
│   └── stretches.tsx
├── triage.html
├── hydration.html
├── posture.html
├── stretches.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## ✨ Características

- ✅ Diseño responsive
- ✅ Interactividad (checkboxes, temporizador)
- ✅ Accesibilidad básica
- ✅ Sin dependencias pesadas
- ✅ Estilo consistente con la app móvil
- ✅ Disclaimers médicos visibles
