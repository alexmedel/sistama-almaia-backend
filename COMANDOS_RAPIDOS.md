# ⚡ Comandos Rápidos - Alma IA ChatGPT Apps SDK

## 🚀 Build y Deploy

### 1. Build UI Components (Primera vez o después de cambios)

```bash
# Opción A: Desde raíz del proyecto
npm run build:ui

# Opción B: Manual
cd ui-components
npm install
npm run build
cd ..
```

**Resultado**: Archivos generados en `ui-components/dist/`

---

### 2. Desarrollo Local

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Probar endpoints
curl -X POST http://localhost:3000/api/v1/chatgpt/hydration_plan \
  -H "Content-Type: application/json" \
  -d '{"weightKg":72,"activityLevel":"moderate","climate":"hot"}'
```

---

### 3. Build Completo para Producción

```bash
# Build UI + Backend
npm run build

# Iniciar en producción
npm start
```

---

## 🧪 Pruebas Rápidas

### Probar los 4 Endpoints

```bash
# 1. Triage
curl -X POST http://localhost:3000/api/v1/chatgpt/triage_symptom \
  -H "Content-Type: application/json" \
  -d '{"symptom":"dolor de cabeza","fever_c":37.8,"duration":"6h","red_flags":[]}'

# 2. Hidratación
curl -X POST http://localhost:3000/api/v1/chatgpt/hydration_plan \
  -H "Content-Type: application/json" \
  -d '{"weightKg":72,"activityLevel":"moderate","climate":"hot"}'

# 3. Postura
curl -X POST http://localhost:3000/api/v1/chatgpt/posture_breaks \
  -H "Content-Type: application/json" \
  -d '{"workPattern":"desk8h"}'

# 4. Estiramientos
curl -X POST http://localhost:3000/api/v1/chatgpt/stretches_5min \
  -H "Content-Type: application/json" \
  -d '{"target":"neck"}'
```

---

### Verificar componentUrl

```bash
# Hacer request y extraer componentUrl
curl -s -X POST http://localhost:3000/api/v1/chatgpt/hydration_plan \
  -H "Content-Type: application/json" \
  -d '{"weightKg":72}' | jq -r '.componentUrl'

# Copiar la URL y abrirla en navegador
```

---

## 🌐 Exponer Local con ngrok (para ChatGPT)

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: ngrok
ngrok http 3000

# Copiar la URL HTTPS (ej: https://abcd-xx.ngrok-free.app)
# Usar esa URL en ChatGPT Developer Mode
```

---

## 📦 Git Workflow

### Commit y Push

```bash
# Ver cambios
git status

# Agregar todo
git add .

# Commit
git commit -m "feat: UI Components React para ChatGPT Apps SDK"

# Push
git push origin feature/gpt-sdk-almaia
```

### Crear Pull Request

```bash
# En GitHub, crear PR de:
# feature/gpt-sdk-almaia → develop
```

---

## 🔍 Verificación Rápida

### Verificar que UI Components está compilado

```bash
# Listar archivos en dist
ls -la ui-components/dist/

# Debe mostrar:
# - triage.html
# - hydration.html
# - posture.html
# - stretches.html
# - assets/ (con archivos .js y .css)
```

### Verificar que Backend sirve los archivos

```bash
# Abrir en navegador:
http://localhost:3000/api/v1/chatgpt/ui/triage
http://localhost:3000/api/v1/chatgpt/ui/hydration
http://localhost:3000/api/v1/chatgpt/ui/posture
http://localhost:3000/api/v1/chatgpt/ui/stretches
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'path'"

```bash
# Asegúrate de que index.ts tenga:
import path from 'path';
```

### Error: "ENOENT: no such file or directory"

```bash
# Build UI Components primero
npm run build:ui
```

### Error: "Module not found" en ui-components

```bash
# Instalar dependencias
cd ui-components
npm install
cd ..
```

### Puerto 3000 ocupado

```bash
# Cambiar puerto en .env o usar otro:
PORT=3001 npm run dev
```

---

## 📊 Verificar Respuestas JSON

### Con jq (formato bonito)

```bash
curl -s -X POST http://localhost:3000/api/v1/chatgpt/stretches_5min \
  -H "Content-Type: application/json" \
  -d '{"target":"neck"}' | jq '.'
```

### Verificar que tiene componentUrl

```bash
curl -s -X POST http://localhost:3000/api/v1/chatgpt/stretches_5min \
  -H "Content-Type: application/json" \
  -d '{"target":"neck"}' | jq 'has("componentUrl")'

# Debe devolver: true
```

### Verificar total_seconds = 300

```bash
curl -s -X POST http://localhost:3000/api/v1/chatgpt/stretches_5min \
  -H "Content-Type: application/json" \
  -d '{"target":"neck"}' | jq '.data.total_seconds'

# Debe devolver: 300
```

---

## 🚀 Deploy en Render

### Verificar que Render ejecuta build:ui

En Render, el build command debe ser:

```bash
npm run build
```

Esto ejecutará automáticamente:
1. `npm run build:ui` (compila UI Components)
2. `tsc` (compila TypeScript del backend)

---

## 📱 URLs de Producción

### Endpoints POST

```
https://api-almaia-prod.onrender.com/api/v1/chatgpt/triage_symptom
https://api-almaia-prod.onrender.com/api/v1/chatgpt/hydration_plan
https://api-almaia-prod.onrender.com/api/v1/chatgpt/posture_breaks
https://api-almaia-prod.onrender.com/api/v1/chatgpt/stretches_5min
```

### Endpoints GET (UI)

```
https://api-almaia-prod.onrender.com/api/v1/chatgpt/ui/triage
https://api-almaia-prod.onrender.com/api/v1/chatgpt/ui/hydration
https://api-almaia-prod.onrender.com/api/v1/chatgpt/ui/posture
https://api-almaia-prod.onrender.com/api/v1/chatgpt/ui/stretches
```

---

## ✅ Checklist Rápido

Antes de hacer commit:

- [ ] `npm run build:ui` ejecutado sin errores
- [ ] `ui-components/dist/` contiene archivos
- [ ] `npm run dev` funciona
- [ ] Los 4 endpoints POST responden con `componentUrl`
- [ ] ComponentUrl abre en navegador
- [ ] UI interactiva funciona (checkboxes, temporizador)
- [ ] `total_seconds` de stretches = 300

---

**Versión**: 1.0  
**Última actualización**: 2025-01-13
