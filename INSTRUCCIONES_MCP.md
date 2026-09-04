# 🚀 Instrucciones Rápidas: Conectar Alma IA a ChatGPT vía MCP

## ✅ Paso a Paso (2 minutos)

### 1️⃣ Abrir ChatGPT Settings

1. Ve a **ChatGPT** (https://chat.openai.com)
2. Click en tu perfil (esquina superior derecha)
3. **Settings** → **Developer Mode** (o "Modo Desarrollador")
4. Click en **"Add MCP Server"** o **"Nuevo conector"**

---

### 2️⃣ Completar Formulario

Copia y pega exactamente:

| Campo | Valor |
|-------|-------|
| **Nombre** | `Alma IA - Bienestar` |
| **Descripción** | `Herramientas de salud y bienestar: triage de síntomas, plan de hidratación, pausas de postura y rutina de estiramientos` |
| **URL del servidor MCP** | `https://api-almaia.onrender.com/api/v1/mcp/sse` |
| **Autenticación** | `None` / `Ninguna` |
| **Confío en esta aplicación** | ✅ **Marcar** |

---

### 3️⃣ Crear y Verificar

1. Click en **"Crear"** o **"Create"**
2. ChatGPT detectará automáticamente **4 herramientas**:
   - ✅ `triage_symptom`
   - ✅ `hydration_plan`
   - ✅ `posture_breaks`
   - ✅ `stretches_5min`

---

## 🧪 Pruebas Rápidas

Una vez conectado, prueba estos prompts en ChatGPT:

### 🩺 Triage de Síntomas
```
"Tengo dolor de cabeza desde hace 6 horas y fiebre de 38°C"
```

### 💧 Plan de Hidratación
```
"Necesito un plan de hidratación, peso 72kg y hago ejercicio moderado"
```

### 🪑 Pausas de Postura
```
"Recuérdame las pausas de postura para trabajar 8 horas"
```

### 🧘 Rutina de Estiramientos
```
"Guíame en una rutina de estiramientos de 5 minutos para el cuello"
```

---

## ✅ Verificación de Conexión

### Opción 1: Desde el Navegador

Abre esta URL en tu navegador:
```
https://api-almaia.onrender.com/api/v1/mcp/health
```

**Deberías ver**:
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

### Opción 2: Desde Terminal (PowerShell)

```powershell
Invoke-RestMethod -Uri "https://api-almaia.onrender.com/api/v1/mcp/health"
```

---

## 🐛 Solución de Problemas

### ❌ "No se puede conectar al servidor"

1. **Verificar URL**: Debe ser exactamente `https://api-almaia.onrender.com/api/v1/mcp/sse`
2. **Verificar servidor**: Abrir el healthcheck en el navegador
3. **Esperar 30s**: Render puede tardar en despertar si está en sleep mode

### ❌ "No se detectan herramientas"

1. **Refrescar la página** de ChatGPT
2. **Eliminar y volver a crear** el conector
3. **Verificar logs** en Render (si tienes acceso)

### ❌ "Error al ejecutar herramienta"

1. **Verificar parámetros**: Algunos son obligatorios (ej: `symptom` en triage)
2. **Revisar formato**: Los parámetros deben cumplir con el schema
3. **Probar endpoint directo**: Usar `curl` o Postman para verificar que el endpoint HTTP funciona

---

## 📚 Documentación Completa

Para más detalles técnicos, ver:
- **[docs/MCP_BRIDGE.md](./MCP_BRIDGE.md)** - Documentación técnica completa
- **[docs/CHATGPT_APPS_SDK.md](./CHATGPT_APPS_SDK.md)** - Documentación de endpoints HTTP

---

## 🎯 ¿Qué Hace el MCP Bridge?

```
ChatGPT → MCP Bridge → Endpoints HTTP → Respuesta
```

1. **ChatGPT** se conecta al MCP Bridge vía SSE
2. **Usuario** pide algo en lenguaje natural
3. **ChatGPT** identifica qué herramienta usar
4. **MCP Bridge** llama al endpoint HTTP correspondiente
5. **Endpoint** retorna datos + HTML
6. **ChatGPT** muestra la respuesta al usuario

---

## ⚠️ Disclaimer Médico

**IMPORTANTE**: Todas las herramientas incluyen el siguiente disclaimer:

> "Esta información es orientativa, no constituye diagnóstico médico. Si hay señales de alerta o los síntomas empeoran, consulta a un profesional de salud."

---

## 📞 Soporte

Si tienes problemas:
1. Revisar esta guía
2. Verificar el healthcheck
3. Contactar al equipo de desarrollo

---

**¡Listo!** 🎉 Ahora puedes usar Alma IA directamente desde ChatGPT.
