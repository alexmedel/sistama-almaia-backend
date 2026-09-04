-- LPDP 2026 / Art. 12
-- Consentimiento explícito, informado, libre y granular.

BEGIN;

CREATE TABLE IF NOT EXISTS public.consentimientos (
  consentimiento_id BIGSERIAL PRIMARY KEY,
  titular_id INTEGER NOT NULL,
  tipo_titular VARCHAR(20) NOT NULL CHECK (tipo_titular IN ('apoderado', 'alumno_mayor')),
  proposito VARCHAR(100) NOT NULL,
  otorgado BOOLEAN NOT NULL,
  alumno_id INTEGER REFERENCES public.alumnos(alumno_id),
  alumno_persona_id INTEGER REFERENCES public.personas(persona_id),
  fecha_consentimiento TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ip_origen VARCHAR(45),
  version_politica VARCHAR(20),
  revocado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_alumno_id
  ON public.consentimientos (alumno_id);

CREATE INDEX IF NOT EXISTS idx_consentimientos_titular_id
  ON public.consentimientos (titular_id);

CREATE INDEX IF NOT EXISTS idx_consentimientos_proposito
  ON public.consentimientos (proposito);

COMMIT;
