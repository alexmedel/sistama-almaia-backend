# Notificaciones push - resumen rapido

## Que se hizo en backend

- Se creo tabla `usuarios_notificaciones` para tener buzon por usuario.
- Se creo RPC `listar_mis_notificaciones_usuario(usuario_id)`.
- Se creo RPC `marcar_usuario_notificacion_leida(usuario_notificacion_id, usuario_id)`.
- Se actualizo envio programado para leer primero `usuarios_notificaciones`.
- Se agrego endpoint autenticado para guardar token push:

```txt
POST /api/v1/notificaciones/push-token
Authorization: Bearer <jwt_login>
Body: { "pushToken": "ExpoPushToken[...]" }
```

- Endpoint viejo sigue existiendo, pero no recomendado:

```txt
POST /api/v1/notificaciones/save-push-token
Body: { "userId": 4206, "pushToken": "ExpoPushToken[...]" }
```

## Que se cambio en app

- App ya no guarda token directo en Supabase.
- App llama backend:

```txt
POST http://192.168.100.28:3001/api/v1/notificaciones/push-token
```

- App usa token JWT de login para autorizacion.
- App corrigio ruta de buzon:

```txt
GET /api/v1/avisosApp/avisos/mis-notificaciones/{usuario_id}
```

Antes pegaba con query vieja y daba `404`.

## Estado actual prueba

Usuario probado:

```txt
jonathanalumno1@almaia.cl
usuario_id: 4206
expo_push_token actual: prueba
token real Expo: NO
```

No se actualizo porque app falla antes de obtener token:

```txt
Default FirebaseApp is not initialized
```

## Falta para token real Android

Crear/bajar `google-services.json` desde Firebase para package:

```txt
com.k2suci.almaia
```

Guardar en app:

```txt
C:\Users\USER\Documents\almaia-app-v2\google-services.json
```

Luego agregar en `app.json`:

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

Y reconstruir:

```powershell
npx expo prebuild --clean
npx expo run:android
```

## Como probar backend sin Firebase

Esto solo prueba que backend guarda token. Token fake no sirve para recibir push.

```powershell
$login = Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:3001/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"identifier":"jonathanalumno1@almaia.cl","password":"TU_PASSWORD"}'

$token = $login.data.token

Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:3001/api/v1/notificaciones/push-token" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"pushToken":"ExpoPushToken[test-local-123]"}'
```

## Verificaciones hechas

Backend:

```powershell
npm test -- --runInBand tests/NotificacionProgramadaSender.test.ts
npx tsc --noEmit
```

App:

```powershell
npx tsc --noEmit
```

App tiene errores TypeScript antiguos no relacionados. Archivos tocados no son causa del fallo principal.

## Importante para app: marcar como leida

El listado devuelve dos ids distintos:

```json
{
  "id": 83,
  "aviso_destinatarios_id": 1659
}
```

Significado:

```txt
id = aviso_id, sirve para identificar/ver el aviso.
aviso_destinatarios_id = usuario_notificacion_id, sirve para marcar leido.
```

Para marcar como leida NO usar `id`.

Usar:

```txt
PATCH /api/v1/avisosApp/avisos/leido/{aviso_destinatarios_id}
Authorization: Bearer <jwt_login>
```

Ejemplo real:

```txt
GET /api/v1/avisosApp/avisos/mis-notificaciones/4206
```

Respuesta:

```json
{
  "id": 83,
  "aviso_destinatarios_id": 1659,
  "titulo": "Aviso prueba AlmaIA",
  "leida": false
}
```

Marcar leida:

```txt
PATCH /api/v1/avisosApp/avisos/leido/1659
```

En app:

```ts
marcarNotificacionLeida(notificacion.aviso_destinatarios_id);
```
