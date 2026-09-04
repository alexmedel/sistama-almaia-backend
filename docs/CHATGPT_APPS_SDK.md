# Integración ChatGPT Apps SDK - Alma IA

## Descripción General

Este módulo proporciona 4 endpoints HTTP para integración con ChatGPT Apps SDK, permitiendo funcionalidades de salud y bienestar directamente desde ChatGPT.

**⚠️ IMPORTANTE**: Estos endpoints requieren la cabecera `x-almaia-chatgpt-key` con el valor de `CHATGPT_APPS_API_KEY` y están diseñados para ser consumidos por ChatGPT Apps SDK.

---

## Endpoints Disponibles

### 1. Triage de Síntomas

**POST** `/api/v1/chatgpt/triage_symptom`

Evalúa síntomas y proporciona orientación general (NO diagnóstico médico).

**Request Body:**
```json
{
  "symptom": "dolor de cabeza",
  "age": 25,
  "duration": "6h",
  "fever_c": 37.8,
  "red_flags": []
}
```

**Response:**
```json
{
  "data": {
    "title": "Orientación General",
    "symptom": "dolor de cabeza",
    "age": 25,
    "duration": "6h",
    "fever_c": 37.8,
    "danger": false,
    "summary": "Síntomas registrados. Si los síntomas empeoran o persisten más de 48 horas, consulta con un profesional de salud.",
    "actions": [
      "Monitorear síntomas",
      "Descansar adecuadamente",
      "Mantenerse hidratado",
      "Consultar si empeora o persiste"
    ]
  },
  "html": "<div>...</div>"
}
```

**Banderas Rojas (requieren atención urgente):**
- Dolor torácico
- Dificultad para respirar
- Desmayo
- Confusión
- Rigidez de cuello
- Debilidad en un lado
- Sangrado abundante
- Fiebre ≥ 39.5°C

---

### 2. Plan de Hidratación

**POST** `/api/v1/chatgpt/hydration_plan`

Calcula plan de hidratación personalizado basado en peso, actividad y clima.

**Request Body:**
```json
{
  "weightKg": 72,
  "activityLevel": "moderate",
  "climate": "hot"
}
```

**Parámetros:**
- `weightKg`: Peso en kilogramos (default: 70)
- `activityLevel`: `low` | `moderate` | `high` (default: `moderate`)
- `climate`: `cold` | `temperate` | `hot` (default: `temperate`)

**Response:**
```json
{
  "data": {
    "total_ml": 2952,
    "schedule": [
      "Al despertar — 300 ml",
      "Media mañana — 300 ml",
      "Almuerzo — 400 ml",
      "Media tarde — 300 ml",
      "Cena — 400 ml",
      "Antes de dormir — 200 ml"
    ],
    "activityLevel": "moderate",
    "climate": "hot",
    "weightKg": 72
  },
  "html": "<div>...</div>"
}
```

**Fórmula de cálculo:**
- Base: `weightKg * 32 ml`
- Actividad alta: `+ weightKg * 5 ml`
- Clima caluroso: `+ weightKg * 4 ml`

---

### 3. Pausas de Postura

**POST** `/api/v1/chatgpt/posture_breaks`

Proporciona checklist de pausas ergonómicas para trabajo de escritorio.

**Request Body:**
```json
{
  "workPattern": "desk8h"
}
```

**Response:**
```json
{
  "data": {
    "workPattern": "desk8h",
    "checklist": [
      "Cada 30–45 min: levántate 2–3 min",
      "Regla 20–20–20: cada 20 min mira 20s a 6 m",
      "Pantalla a la altura de los ojos",
      "Apoya zona lumbar y planta de los pies",
      "Respiración profunda para relajar hombros",
      "Evita encorvar la espalda",
      "Mantén muñecas en posición neutra al escribir"
    ]
  },
  "html": "<div>...</div>"
}
```

---

### 4. Estiramientos 5 Minutos

**POST** `/api/v1/chatgpt/stretches_5min`

Rutina de estiramientos de 5 minutos (300 segundos total).

**Request Body:**
```json
{
  "target": "neck"
}
```

**Parámetros:**
- `target`: `full` | `neck` | `back` | `hands` (default: `full`)

**Response:**
```json
{
  "data": {
    "target": "neck",
    "total_seconds": 300,
    "steps": [
      { "name": "Rotación de cuello (suave)", "duration": 40 },
      { "name": "Estiramiento de hombros hacia atrás", "duration": 40 },
      { "name": "Extensión de brazos al frente", "duration": 40 },
      { "name": "Rotación de muñecas", "duration": 40 },
      { "name": "Estiramiento de espalda alta", "duration": 40 },
      { "name": "Flexión lateral del tronco", "duration": 40 },
      { "name": "Estiramiento de piernas (gemelos)", "duration": 40 },
      { "name": "Respiración profunda y relajación", "duration": 20 }
    ]
  },
  "html": "<div>...</div>"
}
```

---

## Pruebas con cURL

### Desarrollo (Local)

```bash
BASE_URL=http://localhost:3000/api/v1/chatgpt

# Triage
curl -X POST $BASE_URL/triage_symptom \
  -H "Content-Type: application/json" \
  -H "x-almaia-chatgpt-key: $CHATGPT_APPS_API_KEY" \
  -d '{"symptom":"dolor de cabeza","fever_c":37.8,"duration":"6h","red_flags":[]}'

# Hidratación
curl -X POST $BASE_URL/hydration_plan \
  -H "Content-Type: application/json" \
  -H "x-almaia-chatgpt-key: $CHATGPT_APPS_API_KEY" \
  -d '{"weightKg":72,"activityLevel":"moderate","climate":"hot"}'

# Postura
curl -X POST $BASE_URL/posture_breaks \
  -H "Content-Type: application/json" \
  -H "x-almaia-chatgpt-key: $CHATGPT_APPS_API_KEY" \
  -d '{"workPattern":"desk8h"}'

# Estiramientos
curl -X POST $BASE_URL/stretches_5min \
  -H "Content-Type: application/json" \
  -H "x-almaia-chatgpt-key: $CHATGPT_APPS_API_KEY" \
  -d '{"target":"neck"}'
```

### Producción (Render)

```bash
BASE_URL=https://api-almaia-prod.onrender.com/api/v1/chatgpt

# Usar los mismos comandos reemplazando BASE_URL
```

---

## Configuración en ChatGPT

### Paso 1: Acceder a Developer Mode

1. Ir a **ChatGPT Settings** → **Developer Mode**
2. Click en **Create/Add App**

### Paso 2: Configurar la App

**Nombre:** `Alma IA – Mini bienestar diario`

**Descripción:**
```
Guía de bienestar y primeros auxilios no clínicos, recordatorios de hidratación/postura y estiramientos de 5 minutos.
```

### Paso 3: Agregar HTTP Tools (POST)

#### Desarrollo (con ngrok)

Si estás probando localmente, primero expón el servidor:

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Crear túnel ngrok
ngrok http 3000
```

Copia la URL HTTPS de ngrok (ej: `https://abcd-xx.ngrok-free.app`) y configura:

- `https://abcd-xx.ngrok-free.app/api/v1/chatgpt/triage_symptom`
- `https://abcd-xx.ngrok-free.app/api/v1/chatgpt/hydration_plan`
- `https://abcd-xx.ngrok-free.app/api/v1/chatgpt/posture_breaks`
- `https://abcd-xx.ngrok-free.app/api/v1/chatgpt/stretches_5min`

#### Producción (Render)

URLs finales para ChatGPT:

- `https://api-almaia-prod.onrender.com/api/v1/chatgpt/triage_symptom`
- `https://api-almaia-prod.onrender.com/api/v1/chatgpt/hydration_plan`
- `https://api-almaia-prod.onrender.com/api/v1/chatgpt/posture_breaks`
- `https://api-almaia-prod.onrender.com/api/v1/chatgpt/stretches_5min`

### Paso 4: Probar en ChatGPT

Una vez configurado, prueba con prompts como:

- "Alma IA, tengo dolor de cabeza desde hace 6 horas"
- "Necesito un plan de hidratación para hoy, peso 72kg y hace calor"
- "Recuérdame las pausas de postura para trabajar 8 horas"
- "Guíame en una rutina de estiramientos de 5 minutos"

---

## Configuración CORS

El backend ya está configurado para permitir requests desde:

- `https://chat.openai.com` (ChatGPT)
- Otros orígenes configurados en `ALLOWED_ORIGINS` (variable de entorno)

**Archivo:** `src/index.ts` (líneas 127-128)

```typescript
// Agregar ChatGPT a los orígenes permitidos
allowedOrigins.push('https://chat.openai.com');
```

---

## Rate Limiting

Los endpoints de ChatGPT están protegidos por el rate limiter global:

- **100 requests / 2 minutos** por IP

Si necesitas un límite específico para ChatGPT, puedes agregarlo en `src/index.ts`:

```typescript
const chatgptLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60, // 60 requests
  message: { message: 'Demasiadas solicitudes a ChatGPT, inténtelo más tarde.' }
});

app.use('/api/v1/chatgpt', chatgptLimiter, ChatGPTRoutes);
```

---

## Requisitos

- **ChatGPT**: Cuenta con Developer Mode activo
- **Node.js**: 18+ (para desarrollo local)
- **Variables de entorno**: Configuradas en Render
- **ngrok** (opcional): Para pruebas locales con ChatGPT

---

## Notas Importantes

### ⚠️ Disclaimer Médico

**Esta información es orientativa y NO constituye diagnóstico médico.**

Si hay señales de alerta o los síntomas empeoran, consulta a un profesional de salud.

Todos los endpoints incluyen este disclaimer en sus respuestas HTML.

### 🔒 Seguridad

- **Autenticación por API key**: Los endpoints POST requieren `x-almaia-chatgpt-key: <CHATGPT_APPS_API_KEY>`
- **Rate limiting**: Protección contra abuso
- **CORS**: Solo orígenes permitidos
- **Validación**: Todos los inputs son validados
- **HTML seguro**: Sin scripts ni contenido malicioso

### 📊 Monitoreo

Los errores se registran en consola con `console.error()`:

```typescript
console.error('Error en triageSymptom:', error);
```

---

## 🎨 UI Components

### Descripción

Cada endpoint incluye un `componentUrl` que apunta a una interfaz React interactiva con el estilo de Alma IA.

### Build de UI Components

```bash
# Instalar dependencias y compilar
npm run build:ui

# O manualmente
cd ui-components
npm install
npm run build
```

Esto genera archivos en `ui-components/dist/` que se sirven automáticamente desde Express.

### URLs de Componentes

```
GET /api/v1/chatgpt/ui/triage?data={...}
GET /api/v1/chatgpt/ui/hydration?data={...}
GET /api/v1/chatgpt/ui/posture?data={...}
GET /api/v1/chatgpt/ui/stretches?data={...}
```

### Respuesta JSON con componentUrl

```json
{
  "data": { ... },
  "html": "<div>...</div>",
  "componentUrl": "https://api-almaia-prod.onrender.com/api/v1/chatgpt/ui/hydration?data=..."
}
```

- **html**: Fallback (siempre funciona)
- **componentUrl**: UI interactiva React (opcional)

---

## Estructura de Archivos

```
Api-Almaia/
├── src/
│   ├── index.ts [MODIFICADO - servir estáticos]
│   ├── routes/
│   │   └── chatgpt.routes.ts [MODIFICADO - rutas GET UI]
│   └── infrestructure/
│       └── server/
│           └── chatgpt/
│               └── ChatGPTService.ts [MODIFICADO - componentUrl]
├── ui-components/ [NUEVO]
│   ├── src/
│   │   ├── components/ (4 componentes React)
│   │   ├── styles/ (CSS Alma IA)
│   │   └── *.tsx (4 entry points)
│   ├── *.html (4 archivos)
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── CHATGPT_APPS_SDK.md [MODIFICADO]
└── GUIA_TESTERS_CHATGPT.md [NUEVO]
```

---

## Registrar App en ChatGPT (Modo Desarrollador)

### Paso 1: Activar Modo Desarrollador

1. ChatGPT → **Ajustes** → **Aplicaciones y Conectores**
2. Activar **Modo Desarrollador** (Beta)

### Paso 2: Crear App

1. Click en **Crear App**
2. Nombre: `Alma IA – Mini bienestar diario`
3. Descripción: `Guía de bienestar y primeros auxilios no clínicos`

### Paso 3: Agregar HTTP Tools (POST)

**Producción:**
```
https://api-almaia-prod.onrender.com/api/v1/chatgpt/triage_symptom
https://api-almaia-prod.onrender.com/api/v1/chatgpt/hydration_plan
https://api-almaia-prod.onrender.com/api/v1/chatgpt/posture_breaks
https://api-almaia-prod.onrender.com/api/v1/chatgpt/stretches_5min
```

**Desarrollo (con ngrok):**
```
https://<tu-ngrok>.ngrok-free.app/api/v1/chatgpt/triage_symptom
https://<tu-ngrok>.ngrok-free.app/api/v1/chatgpt/hydration_plan
https://<tu-ngrok>.ngrok-free.app/api/v1/chatgpt/posture_breaks
https://<tu-ngrok>.ngrok-free.app/api/v1/chatgpt/stretches_5min
```

### Paso 4: Probar en ChatGPT

```
"Alma IA, rutina de estiramiento 5 min para cuello"
"Alma IA, plan de hidratación para hoy, peso 72kg"
"Alma IA, tengo fiebre de 39°C y dolor de cabeza"
```

> **Nota**: Apps SDK está en preview. Las submissions públicas (listado/monetización) las abre OpenAI después.

---

## Checklist de Deployment

### Desarrollo Local

- [ ] `npm run build:ui` ejecutado sin errores
- [ ] `ui-components/dist/` contiene archivos HTML y JS
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Endpoints POST responden con `componentUrl`
- [ ] `total_seconds` de stretches = 300
- [ ] ComponentUrl abre en navegador
- [ ] UI interactiva funciona (checkboxes, temporizador)
- [ ] ngrok túnel activo (si pruebas con ChatGPT)

### Producción (Render)

- [ ] Merge a `develop` aprobado
- [ ] Deploy en Render exitoso
- [ ] Variable `ALLOWED_ORIGINS` incluye dominios necesarios
- [ ] Endpoints públicos accesibles
- [ ] Documentación Swagger actualizada
- [ ] Pruebas con ChatGPT funcionando

---

## Soporte

Para dudas o problemas:

- **Email**: soporte@almaia.cl
- **Documentación API**: https://api-almaia-prod.onrender.com/documentacion

---

**Versión**: 1.0  
**Fecha**: 2025-01-13  
**Autor**: Equipo Alma IA
