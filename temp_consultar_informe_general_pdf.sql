CREATE OR REPLACE FUNCTION public.consultar_informe_general_pdf(
  p_informe_id integer
)
RETURNS TABLE(
  informe_id integer,
  tipo text,
  template_informe text,
  periodo text,
  periodo_anio integer,
  periodo_mes integer,
  descripcion_informe text,
  recomendacion_almaia text,
  nivel text,
  nombre_curso text,
  docente text,
  colegio_id integer,
  colegio text,
  nombre_fantasia text,
  alerta_neurodivergencia boolean
)
LANGUAGE sql
AS $function$
  SELECT
    ig.informe_id,
    COALESCE((to_jsonb(ig)->>'tipo'), '')::text AS tipo,
    COALESCE((to_jsonb(ig)->>'template_informe'), '')::text AS template_informe,
    INITCAP(
      CASE ig.periodo_mes
        WHEN 1 THEN 'enero'
        WHEN 2 THEN 'febrero'
        WHEN 3 THEN 'marzo'
        WHEN 4 THEN 'abril'
        WHEN 5 THEN 'mayo'
        WHEN 6 THEN 'junio'
        WHEN 7 THEN 'julio'
        WHEN 8 THEN 'agosto'
        WHEN 9 THEN 'septiembre'
        WHEN 10 THEN 'octubre'
        WHEN 11 THEN 'noviembre'
        WHEN 12 THEN 'diciembre'
      END || ' ' || ig.periodo_anio::text
    ) AS periodo,
    ig.periodo_anio,
    ig.periodo_mes,

    COALESCE(
      to_jsonb(ig)->>'descripcion_informe',
      to_jsonb(ig)->>'analisis_diagnostico',
      to_jsonb(ig)->>'cuerpo',
      ''
    )::text AS descripcion_informe,

    COALESCE(
      to_jsonb(ig)->>'recomendacion_almaia',
      to_jsonb(ig)->>'analisis_recomendaciones',
      to_jsonb(ig)->>'recomendaciones',
      ''
    )::text AS recomendacion_almaia,

    COALESCE((to_jsonb(ig)->>'nivel'), '')::text AS nivel,
    COALESCE((to_jsonb(ig)->>'nombre_curso'), '')::text AS nombre_curso,
    COALESCE((to_jsonb(ig)->>'docente'), '')::text AS docente,
    co.colegio_id,
    co.nombre AS colegio,
    co.nombre_fantasia,
    COALESCE((to_jsonb(ig)->>'alerta_neurodivergencia')::boolean, false) AS alerta_neurodivergencia
  FROM informes_generales ig
  LEFT JOIN colegios co
    ON co.colegio_id = ig.colegio_id
  WHERE ig.informe_id = p_informe_id
    AND ig.activo = TRUE
    AND ig.periodo_anio IS NOT NULL
    AND ig.periodo_mes IS NOT NULL
  LIMIT 1;
$function$;
