-- LPDP 2026 / Art. 16
-- Add is_blocked to PII tables for right-to-block implementation.
-- NOTE:
-- - Uses IF NOT EXISTS for idempotent deploys.
-- - Includes both current names and names reportadas en issue.

BEGIN;

-- Tablas PII actuales en base
ALTER TABLE IF EXISTS public.alumnos
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.apoderados
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.personas
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.usuarios
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.alumnos_alertas
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.alumnos_ant_clinicos
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.alumnos_ant_familiares
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.alumnos_diarios
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Nombres de evidencia original (si existen en otro entorno)
ALTER TABLE IF EXISTS public.alumno_antecedente_clinico
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.alumno_antecedente_familiar
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.alumno_diario
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Índices livianos para filtrar rápido en queries de lectura
CREATE INDEX IF NOT EXISTS idx_alumnos_is_blocked_false
  ON public.alumnos (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_apoderados_is_blocked_false
  ON public.apoderados (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_personas_is_blocked_false
  ON public.personas (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_usuarios_is_blocked_false
  ON public.usuarios (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_alumnos_alertas_is_blocked_false
  ON public.alumnos_alertas (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_alumnos_ant_clinicos_is_blocked_false
  ON public.alumnos_ant_clinicos (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_alumnos_ant_familiares_is_blocked_false
  ON public.alumnos_ant_familiares (is_blocked) WHERE is_blocked = FALSE;

CREATE INDEX IF NOT EXISTS idx_alumnos_diarios_is_blocked_false
  ON public.alumnos_diarios (is_blocked) WHERE is_blocked = FALSE;

COMMIT;

-- Remediación requerida en app: añadir en queries de PII
-- .eq("is_blocked", false)
