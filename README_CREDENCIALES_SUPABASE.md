# Credenciales Supabase Hardcodeadas En Frontend

## Resumen

La app movil contiene una `service_role key` de Supabase escrita directamente en el codigo.

Esto es una vulnerabilidad critica. Esa key no debe vivir en frontend, porque puede extraerse desde el APK/IPA o desde el bundle JavaScript.

## Archivo Afectado

```ts
assets/utils/supabaseClient.ts
```

## Problema

El frontend crea un cliente Supabase usando una key administrativa:

```ts
const supabaseKey = "SERVICE_ROLE_KEY_AQUI";
```

Luego usa ese cliente para actualizar datos directamente en Supabase, por ejemplo el token push del usuario.

## Riesgo

Una `service_role key` expuesta permite saltarse RLS y operar con privilegios administrativos.

Impacto posible:

- lectura de datos privados
- modificacion de registros
- borrado de informacion
- actualizacion de tokens push de otros usuarios
- acceso no autorizado a tablas internas
- compromiso completo del proyecto Supabase

## Solucion Recomendada

Eliminar la `service_role key` del frontend.

La app debe llamar al backend para operaciones sensibles.

### Endpoint Propuesto

```http
POST /api/v1/notificaciones/push-token
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body:

```json
{
  "pushToken": "ExponentPushToken[xxxx]"
}
```

### Regla

El cliente no debe enviar `userId`, `email` ni `auth_id` para decidir a quien actualizar.

El backend debe tomar el usuario autenticado desde la sesion:

```ts
req.user.usuario_id
```

## Flujo Correcto

1. App pide permisos de notificaciones.
2. App obtiene `ExpoPushToken`.
3. App llama endpoint backend autenticado.
4. Backend valida sesion.
5. Backend actualiza `usuarios.expo_push_token`.
6. Frontend nunca recibe ni usa `service_role key`.

## Evidencia

Pegar captura aqui:

![Credencial hardcodeada](./imagenes/credencial-hardcodeada.png)

## Checklist De Fix

- [ ] Eliminar `service_role key` del codigo movil.
- [ ] Crear endpoint backend autenticado para guardar token push.
- [ ] Reemplazar escritura directa a Supabase por llamada HTTP al backend.
- [ ] Rotar la `service_role key` expuesta en Supabase.
- [ ] Verificar que el bundle final no contiene claves sensibles.
