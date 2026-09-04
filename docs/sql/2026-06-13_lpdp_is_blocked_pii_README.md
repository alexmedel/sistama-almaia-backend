# LPDP `is_blocked` en tablas PII

## Qué se hizo

Se ejecutó migración `2026-06-13_lpdp_is_blocked_pii.sql` para agregar columna:

- `is_blocked BOOLEAN NOT NULL DEFAULT FALSE`

Tablas cubiertas:

- `alumnos`
- `apoderados`
- `personas`
- `usuarios`
- `alumnos_alertas`
- `alumnos_ant_clinicos`
- `alumnos_ant_familiares`
- `alumnos_diarios`

También se incluyeron nombres alternativos del informe con `IF EXISTS` para no fallar en otros entornos.

## Por qué no impacta endpoints hoy

Este cambio solo agrega columna nueva con valor por defecto `FALSE`.

No cambia:

- contratos de request/response
- nombres de columnas existentes
- joins actuales
- filtros actuales
- reglas de negocio actuales

Por eso, endpoints existentes siguen respondiendo igual mientras no se empiece a filtrar por `is_blocked`.

## Qué falta para cierre completo

Para implementar bloqueo lógico real exigido por LPDP, consultas que leen PII deben excluir registros bloqueados, por ejemplo:

```ts
.eq("is_blocked", false)
```

Ese paso sí debe hacerse con revisión funcional, porque puede cambiar resultados de listados, búsquedas y detalles.
