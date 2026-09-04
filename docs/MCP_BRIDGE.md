# 🌉 MCP Bridge - Alma IA

Puente MCP (Model Context Protocol) que expone los 4 endpoints de salud y bienestar de Alma IA como herramientas MCP para ChatGPT.

## 📍 Endpoint Principal

```
https://api-almaia.onrender.com/api/v1/mcp/sse
```

## 🔧 Configuración en ChatGPT

### Paso 1: Abrir Modal de Nuevo Conector

En ChatGPT, ve a:
- **Settings** → **Developer Mode** → **Add MCP Server** (o "Nuevo conector")

### Paso 2: Completar Formulario

- **Nombre**: `Alma IA - Bienestar`
- **Descripción**: `Herramientas de salud y bienestar: triage de síntomas, plan de hidratación, pausas de postura y rutina de estiramientos`
- **URL del servidor MCP**: `https://api-almaia.onrender.com/api/v1/mcp/sse`
- **Autenticación**: `None` / `Ninguna`
- **Confío en esta aplicación**: ✅ Marcar

### Paso 3: Crear y Probar

Click en **Crear** → ChatGPT detectará automáticamente las 4 herramientas disponibles.

---

## 🛠️ Herramientas Disponibles

### 1. `triage_symptom`
**Descripción**: Orientación inicial NO clínica para síntomas leves (con banderas rojas).

**Parámetros**:
- `symptom` (string, **requerido**): Descripción del síntoma
- `age` (number, opcional): Edad del paciente
- `duration` (string, opcional): Duración del síntoma (ej: "6h")
- `fever_c` (number, opcional): Temperatura en °C
- `red_flags` (array[string], opcional): Señales de alerta

**Ejemplo de uso en ChatGPT**:
```
"Tengo dolor de cabeza desde hace 6 horas y fiebre de 38°C"
```

---

### 2. `hydration_plan`
**Descripción**: Plan de hidratación diario (ml/día) según peso/actividad/clima.

**Parámetros**:
- `weightKg` (number, opcional): Peso en kilogramos
- `activityLevel` (enum, opcional): `low`, `moderate`, `high`
- `climate` (enum, opcional): `cold`, `temperate`, `hot`

**Ejemplo de uso en ChatGPT**:
```
"Necesito un plan de hidratación, peso 72kg y hago ejercicio moderado"
```

---

### 3. `posture_breaks`
**Descripción**: Pausas ergonómicas y regla 20-20-20 para trabajo de escritorio.

**Parámetros**:
- `workPattern` (string, opcional): Patrón de trabajo (ej: "desk8h")

**Ejemplo de uso en ChatGPT**:
```
"Recuérdame las pausas de postura para trabajar 8 horas"
```

---

### 4. `stretches_5min`
**Descripción**: Rutina de estiramientos guiada de 5 minutos (300s).

**Parámetros**:
- `target` (enum, opcional): `full`, `neck`, `back`, `hands`

**Ejemplo de uso en ChatGPT**:
```
"Guíame en una rutina de estiramientos de 5 minutos para el cuello"
```

---

## 🏗️ Arquitectura

```
ChatGPT (MCP Client)
    ↓
    ↓ SSE Connection
    ↓
/api/v1/mcp/sse (MCP Bridge)
    ↓
    ↓ HTTP POST
    ↓
/api/v1/chatgpt/* (Endpoints Existentes)
    ↓
    ↓ Response: { data, html, componentUrl }
    ↓
ChatGPT (Muestra HTML o componentUrl)
```

### Flujo de Datos

1. **ChatGPT** se conecta vía SSE a `/api/v1/mcp/sse`
2. **ChatGPT** solicita lista de herramientas → `tools/list`
3. **Usuario** invoca una herramienta en ChatGPT
4. **MCP Bridge** recibe `tools/call` con parámetros
5. **MCP Bridge** valida con Zod y llama al endpoint HTTP correspondiente
6. **Endpoint HTTP** retorna `{ data, html, componentUrl }`
7. **MCP Bridge** envía el `html` como respuesta a ChatGPT
8. **ChatGPT** muestra el contenido al usuario

---

## 🧪 Pruebas Locales

### Healthcheck
```bash
curl http://localhost:3000/api/v1/mcp/health
```

**Respuesta esperada**:
```json
{
  "status": "OK",
  "service": "MCP Bridge",
  "endpoint": "/api/v1/mcp/sse",
  "tools": [
    "triage_symptom",
    "hydration_plan",
    "posture_breaks",
    "stretches_5min"
  ]
}
```

### Probar SSE Connection
```bash
curl -N http://localhost:3000/api/v1/mcp/sse
```

**Respuesta esperada** (stream continuo):
```
event: connected
data: {"type":"connected","server":{"name":"almaia-mcp-bridge","version":"1.0.0"}}

: keepalive

: keepalive
...
```

### Probar Tool Call (tools/list)
```bash
curl -X POST http://localhost:3000/api/v1/mcp/message \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","params":{}}'
```

### Probar Tool Call (triage_symptom)
```bash
curl -X POST http://localhost:3000/api/v1/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "triage_symptom",
      "arguments": {
        "symptom": "dolor de cabeza",
        "age": 25,
        "duration": "6h",
        "fever_c": 37.8
      }
    }
  }'
```

---

## 🔒 Seguridad

- ✅ **CORS**: Configurado para permitir `https://chat.openai.com`
- ✅ **Rate Limiting**: Heredado del servidor principal (100 req/2min)
- ✅ **Validación**: Zod valida todos los parámetros de entrada
- ✅ **Sin Autenticación**: Los endpoints de ChatGPT son públicos (por diseño)

---

## 📦 Dependencias

```json
{
  "@modelcontextprotocol/sdk": "^latest",
  "zod": "^latest",
  "node-fetch": "^latest"
}
```

---

## 🚀 Deployment

### Variables de Entorno

```bash
ALMAIA_BASE_URL=https://api-almaia.onrender.com/api/v1/chatgpt
```

Si no está definida, usa `http://localhost:3000/api/v1/chatgpt` por defecto.

### Render

El MCP Bridge se despliega automáticamente con el resto de la API. No requiere configuración adicional.

---

## 📝 Notas Técnicas

1. **No usa el SDK MCP completo**: Implementación simplificada con SSE manual para evitar conflictos de dependencias.

2. **Reutiliza endpoints existentes**: No duplica lógica de negocio, solo actúa como puente.

3. **Formato de respuesta**: Retorna el campo `html` de los endpoints existentes como contenido textual para ChatGPT.

4. **componentUrl**: Aunque se genera en los endpoints HTTP, no se usa en la respuesta MCP (ChatGPT no lo soporta directamente en MCP).

---

## 🐛 Troubleshooting

### ChatGPT no detecta las herramientas

- Verificar que la URL sea exactamente: `https://api-almaia.onrender.com/api/v1/mcp/sse`
- Verificar que el servidor esté corriendo (healthcheck)
- Revisar logs de Render para errores

### Error "Unknown tool"

- Verificar que el nombre del tool sea exacto (case-sensitive)
- Revisar que los parámetros cumplan con el schema de Zod

### Timeout en SSE

- Render puede cerrar conexiones SSE después de 30s de inactividad
- El keepalive cada 30s debería prevenir esto

---

## 📚 Referencias

- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [ChatGPT Apps SDK Docs](https://platform.openai.com/docs/chatgpt-apps)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

**Última actualización**: 2025-01-13
**Versión**: 1.0.0
**Autor**: Alma IA Team
