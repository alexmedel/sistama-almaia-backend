# 🤖 Guía para Testers - Alma IA en ChatGPT

## 📋 Configuración Inicial (Solo una vez)

### Paso 1: Activar Modo Desarrollador en ChatGPT

1. Abre **ChatGPT** (https://chat.openai.com)
2. Ve a **Ajustes** (Settings) → **Aplicaciones y Conectores** (Apps & Connectors)
3. Activa **Modo Desarrollador** (Developer Mode) - Beta

> **Nota**: Si no ves esta opción, puede estar en **Ajustes** → **Avanzado** → **Developer Mode**

### Paso 2: Crear la App "Alma IA"

1. En Modo Desarrollador, haz clic en **Crear App** (Create App)
2. Nombre: `Alma IA – Mini bienestar diario`
3. Descripción: `Guía de bienestar y primeros auxilios no clínicos, recordatorios de hidratación/postura y estiramientos de 5 minutos.`

### Paso 3: Agregar HTTP Tools (4 endpoints POST)

Agrega estos 4 endpoints uno por uno:

#### 1. Triage de Síntomas
```
URL: https://api-almaia-prod.onrender.com/api/v1/chatgpt/triage_symptom
Método: POST
Descripción: Orientación de síntomas (NO diagnóstico médico)
```

#### 2. Plan de Hidratación
```
URL: https://api-almaia-prod.onrender.com/api/v1/chatgpt/hydration_plan
Método: POST
Descripción: Plan de hidratación personalizado
```

#### 3. Pausas de Postura
```
URL: https://api-almaia-prod.onrender.com/api/v1/chatgpt/posture_breaks
Método: POST
Descripción: Pausas ergonómicas para trabajo de escritorio
```

#### 4. Rutina de Estiramientos
```
URL: https://api-almaia-prod.onrender.com/api/v1/chatgpt/stretches_5min
Método: POST
Descripción: Rutina de estiramientos de 5 minutos
```

---

## 🧪 Pruebas a Realizar

### Test 1: Orientación de Síntomas

**Prompt para ChatGPT:**
```
Alma IA, tengo dolor de cabeza desde hace 6 horas y fiebre de 38°C
```

**Resultado esperado:**
- Orientación general
- Lista de acciones recomendadas
- Disclaimer médico visible

### Test 2: Plan de Hidratación

**Prompt para ChatGPT:**
```
Alma IA, necesito un plan de hidratación. Peso 72kg, hago ejercicio moderado y hace calor
```

**Resultado esperado:**
- Total de ml recomendados
- Horarios sugeridos
- Opción de ver plan interactivo (componentUrl)

### Test 3: Pausas de Postura

**Prompt para ChatGPT:**
```
Alma IA, trabajo 8 horas en escritorio, ¿qué pausas de postura debo hacer?
```

**Resultado esperado:**
- Lista de pausas ergonómicas
- Regla 20-20-20 para descanso visual
- Checklist interactivo (componentUrl)

### Test 4: Rutina de Estiramientos

**Prompt para ChatGPT:**
```
Alma IA, quiero una rutina de estiramientos de 5 minutos para el cuello
```

**Resultado esperado:**
- 8 pasos de ejercicios
- Duración total: 300 segundos (5 minutos)
- Temporizador interactivo (componentUrl)

---

## 🎨 UI Interactiva (Componentes React)

Cuando ChatGPT responda, puede incluir un enlace `componentUrl`. Al hacer clic:

### ✨ Características de los Componentes

1. **TriageCard**
   - Banderas rojas visuales (fondo rojo si peligro)
   - Lista numerada de acciones
   - Disclaimer médico

2. **HydrationPlan**
   - ✅ Checkboxes para marcar tomas completadas
   - 📊 Barra de progreso
   - 🎯 Contador de cumplimiento

3. **PostureChecklist**
   - ✅ Checkboxes interactivos
   - 📊 Progreso visual
   - 🔄 Botones "Reiniciar" y "Marcar Todas"

4. **StretchesTimer**
   - ⏱️ Temporizador funcional de 5 minutos
   - ▶️ Controles: Play, Pause, Skip, Reset
   - 📋 Lista de 8 pasos guiados

---

## ⚠️ Avisos Importantes

### Disclaimer Médico

> **Esta información es orientativa, NO constituye diagnóstico médico.**
> 
> Si presentas señales de alerta o los síntomas empeoran, acude a un profesional de salud.

### Banderas Rojas (Atención Urgente)

Si mencionas alguno de estos síntomas, Alma IA te recomendará **buscar atención médica inmediata**:

- ❌ Dolor torácico
- ❌ Dificultad para respirar
- ❌ Desmayo
- ❌ Confusión
- ❌ Rigidez de cuello
- ❌ Debilidad en un lado del cuerpo
- ❌ Sangrado abundante
- ❌ Fiebre ≥ 39.5°C

---

## 🐛 Reporte de Problemas

Si encuentras algún problema, reporta:

1. **Prompt usado**: Copia exactamente lo que escribiste
2. **Respuesta de ChatGPT**: Captura de pantalla
3. **Comportamiento esperado**: Qué esperabas que pasara
4. **Comportamiento actual**: Qué pasó realmente

**Enviar a**: soporte@almaia.cl

---

## 📊 Checklist de Pruebas

- [ ] Modo Desarrollador activado
- [ ] App "Alma IA" creada
- [ ] 4 HTTP Tools agregados
- [ ] Test 1: Triage de síntomas ✓
- [ ] Test 2: Plan de hidratación ✓
- [ ] Test 3: Pausas de postura ✓
- [ ] Test 4: Rutina de estiramientos ✓
- [ ] ComponentUrl abre correctamente
- [ ] UI interactiva funciona (checkboxes, temporizador)
- [ ] Disclaimers médicos visibles

---

## 🎯 Casos de Uso Adicionales

### Ejemplo 1: Síntoma con Bandera Roja
```
Alma IA, tengo dolor en el pecho y dificultad para respirar
```
**Esperado**: Alerta roja, recomendación de atención urgente

### Ejemplo 2: Hidratación con Actividad Alta
```
Alma IA, peso 80kg, hago ejercicio intenso y hace mucho calor
```
**Esperado**: Plan con más ml recomendados

### Ejemplo 3: Estiramientos Específicos
```
Alma IA, rutina de estiramientos para espalda
```
**Esperado**: Rutina de 5 minutos enfocada en espalda

---

## 📱 Compatibilidad

- ✅ **Desktop**: Chrome, Firefox, Safari, Edge
- ✅ **Mobile**: iOS Safari, Android Chrome
- ✅ **Tablets**: iPad, Android tablets

---

## 🔒 Privacidad y Seguridad

- ✅ Sin tracking ni fingerprinting
- ✅ Sin scripts externos
- ✅ Datos NO se almacenan en el servidor
- ✅ Comunicación HTTPS encriptada
- ✅ CORS configurado solo para chat.openai.com

---

## 📚 Recursos Adicionales

- **Documentación API**: https://api-almaia-prod.onrender.com/documentacion
- **Soporte**: soporte@almaia.cl
- **Sitio Web**: https://almaia.cl

---

**Versión**: 1.0  
**Fecha**: 2025-01-13  
**Estado**: Beta - Modo Desarrollador

---

## 💡 Tips para Testers

1. **Sé específico**: Cuanto más detalles des, mejor será la orientación
2. **Prueba casos extremos**: Síntomas graves, valores atípicos, etc.
3. **Verifica disclaimers**: Asegúrate de que siempre aparezcan
4. **Prueba la UI**: Haz clic en los componentUrl y prueba la interactividad
5. **Reporta bugs**: Cualquier comportamiento extraño, repórtalo

---

**¡Gracias por ayudarnos a mejorar Alma IA! 🙏**
