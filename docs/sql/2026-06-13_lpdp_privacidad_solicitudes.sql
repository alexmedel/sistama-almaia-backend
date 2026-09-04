-- LPDP 2026 / ARCOP+B
-- Registro auditable de solicitudes de derechos del titular.

BEGIN;

CREATE TABLE IF NOT EXISTS public.privacidad_solicitudes (
  solicitud_privacidad_id BIGSERIAL PRIMARY KEY,
  tipo_derecho VARCHAR(30) NOT NULL CHECK (
    tipo_derecho IN (
      'ACCESO',
      'RECTIFICACION',
      'CANCELACION',
      'OPOSICION',
      'PORTABILIDAD',
      'BLOQUEO'
    )
  ),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (
    estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'COMPLETADA')
  ),
  canal VARCHAR(20) NOT NULL DEFAULT 'API',
  solicitante_usuario_id BIGINT REFERENCES public.usuarios(usuario_id),
  solicitante_persona_id BIGINT REFERENCES public.personas(persona_id),
  titular_usuario_id BIGINT REFERENCES public.usuarios(usuario_id),
  titular_persona_id BIGINT REFERENCES public.personas(persona_id),
  es_representacion BOOLEAN NOT NULL DEFAULT FALSE,
  detalle JSONB NOT NULL DEFAULT '{}'::jsonb,
  respuesta JSONB,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  fecha_resolucion TIMESTAMPTZ,
  creado_por BIGINT,
  actualizado_por BIGINT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_privacidad_solicitudes_tipo
  ON public.privacidad_solicitudes (tipo_derecho);

CREATE INDEX IF NOT EXISTS idx_privacidad_solicitudes_estado
  ON public.privacidad_solicitudes (estado);

CREATE INDEX IF NOT EXISTS idx_privacidad_solicitudes_solicitante
  ON public.privacidad_solicitudes (solicitante_usuario_id);

CREATE INDEX IF NOT EXISTS idx_privacidad_solicitudes_titular
  ON public.privacidad_solicitudes (titular_persona_id);

COMMIT;
