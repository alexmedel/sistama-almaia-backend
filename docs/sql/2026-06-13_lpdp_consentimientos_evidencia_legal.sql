-- LPDP 2026 / Art. 12
-- Refuerzo de evidencia legal para consentimiento auditable.

BEGIN;

ALTER TABLE public.consentimientos
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES public.usuarios(usuario_id),
  ADD COLUMN IF NOT EXISTS apoderado_id INTEGER REFERENCES public.apoderados(apoderado_id),
  ADD COLUMN IF NOT EXISTS texto_consentimiento TEXT,
  ADD COLUMN IF NOT EXISTS texto_consentimiento_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS canal VARCHAR(50),
  ADD COLUMN IF NOT EXISTS origen_pantalla VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS dispositivo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidencia_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS motivo_revocacion TEXT;

CREATE INDEX IF NOT EXISTS idx_consentimientos_usuario_id
  ON public.consentimientos (usuario_id);

CREATE INDEX IF NOT EXISTS idx_consentimientos_apoderado_id
  ON public.consentimientos (apoderado_id);

CREATE INDEX IF NOT EXISTS idx_consentimientos_fecha_consentimiento
  ON public.consentimientos (fecha_consentimiento DESC);

CREATE INDEX IF NOT EXISTS idx_consentimientos_texto_hash
  ON public.consentimientos (texto_consentimiento_hash);

COMMIT;
