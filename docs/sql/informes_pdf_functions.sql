-- RPC: Informe alumno on-demand para PDF
CREATE OR REPLACE FUNCTION public.consultar_informe_alumno_pdf(
  p_alumno_informe_id integer
)
RETURNS TABLE(
  alumno_informe_id integer,
  alumno_id integer,
  template_informe text,
  periodo text,
  periodo_anio integer,
  periodo_mes integer,
  periodo_inicio date,
  periodo_fin date,
  descripcion_informe text,
  recomendacion_almaia text,
  nombre_curso text,
  colegio_id integer,
  colegio text,
  nombre_fantasia text,
  nombres text,
  apellidos text,
  alerta_neurodivergencia boolean,
  alerta_emociones boolean,
  alerta_patologica boolean
)
LANGUAGE sql
AS $function$
  SELECT
    ai.alumno_informe_id,
    ai.alumno_id,
    ai.template_informe,
    INITCAP(
      CASE ai.periodo_mes
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
      END || ' ' || ai.periodo_anio::text
    ) AS periodo,
    ai.periodo_anio,
    ai.periodo_mes,
    ai.periodo_inicio,
    ai.periodo_fin,
    mi.descripcion_informe,
    mi.recomendacion_almaia,
    c.nombre_curso,
    co.colegio_id,
    co.nombre AS colegio,
    co.nombre_fantasia,
    p.nombres,
    p.apellidos,
    EXISTS (
      SELECT 1
      FROM alumnos_alertas ae
      WHERE ae.alumno_id = a.alumno_id
        AND ae.tipo_concepto = 'Neurodivergencia'
        AND ae.fecha_creacion::date BETWEEN ai.periodo_inicio AND ai.periodo_fin
    ) AS alerta_neurodivergencia,
    EXISTS (
      SELECT 1
      FROM alumnos_alertas ae
      WHERE ae.alumno_id = a.alumno_id
        AND ae.tipo_concepto = 'Emociones'
        AND ae.fecha_creacion::date BETWEEN ai.periodo_inicio AND ai.periodo_fin
    ) AS alerta_emociones,
    EXISTS (
      SELECT 1
      FROM alumnos_alertas ae
      WHERE ae.alumno_id = a.alumno_id
        AND ae.tipo_concepto = 'Patologica'
        AND ae.fecha_creacion::date BETWEEN ai.periodo_inicio AND ai.periodo_fin
    ) AS alerta_patologica
  FROM alumnos_informes ai
  JOIN alumnos a
    ON a.alumno_id = ai.alumno_id
  JOIN alumnos_cursos ac
    ON ac.alumno_id = a.alumno_id
   AND ac.activo = TRUE
   AND ac.ano_escolar = ai.periodo_anio
  JOIN cursos c
    ON c.curso_id = ac.curso_id
  JOIN colegios co
    ON co.colegio_id = c.colegio_id
  JOIN personas p
    ON p.persona_id = a.persona_id
  LEFT JOIN matriz_informes mi
    ON mi.nombre_fisico = ai.template_informe
  WHERE ai.alumno_informe_id = p_alumno_informe_id
    AND ai.activo = TRUE
    AND ai.periodo_anio IS NOT NULL
    AND ai.periodo_mes IS NOT NULL
  LIMIT 1;
$function$;

-- RPC: Informe general on-demand para PDF (tipos Grado/Curso/Colegio)
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
    COALESCE(ig.tipo, '') AS tipo,
    COALESCE(ig.template_informe, '') AS template_informe,
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
    COALESCE(mi.descripcion_informe, '') AS descripcion_informe,
    COALESCE(mi.recomendacion_almaia, '') AS recomendacion_almaia,
    COALESCE(ig.nivel, '') AS nivel,
    COALESCE(c.nombre_curso, '') AS nombre_curso,
    COALESCE(docente.nombre_docente, '') AS docente,
    co.colegio_id,
    co.nombre AS colegio,
    co.nombre_fantasia,
    false AS alerta_neurodivergencia
  FROM informes_generales ig
  LEFT JOIN matriz_informes mi
    ON mi.nombre_fisico = ig.template_informe
  LEFT JOIN cursos c
    ON c.curso_id = ig.curso_id
  LEFT JOIN colegios co
    ON co.colegio_id = ig.colegio_id
  LEFT JOIN LATERAL (
    SELECT CONCAT_WS(' ', p.nombres, p.apellidos) AS nombre_docente
    FROM docentes_cursos dc
    JOIN docentes d
      ON d.docente_id = dc.docente_id
    JOIN personas p
      ON p.persona_id = d.persona_id
    WHERE dc.curso_id = ig.curso_id
      AND dc.activo = TRUE
      AND (dc.ano_escolar = ig.periodo_anio OR dc.ano_escolar IS NULL)
    ORDER BY dc.ano_escolar DESC NULLS LAST, dc.docente_curso_id DESC
    LIMIT 1
  ) docente ON TRUE
  WHERE ig.informe_id = p_informe_id
    AND ig.activo = TRUE
    AND ig.periodo_anio IS NOT NULL
    AND ig.periodo_mes IS NOT NULL
  LIMIT 1;
$function$;
