DROP FUNCTION IF EXISTS public.obtener_cantidades_por_diagnostico(integer, date, text);

CREATE OR REPLACE FUNCTION public.obtener_cantidades_por_diagnostico(
  p_colegio_id integer DEFAULT NULL::integer,
  p_fecha_hasta date DEFAULT now(),
  p_tipo_concepto text DEFAULT 'Patologia'::text
)
RETURNS TABLE(
  diagnostico text,
  cantidad numeric,
  cantidad_respuestas integer,
  cantidad_positivas integer,
  cantidad_negativas integer,
  cantidad_neutras integer,
  color text
)
LANGUAGE sql
AS $function$
  SELECT
    COALESCE(d.subcategoria, p.diagnostico)::text AS diagnostico,
    SUM(x.peso / 2.0)::numeric AS cantidad,
    COUNT(*)::integer AS cantidad_respuestas,
    COUNT(*) FILTER (WHERE x.peso = 0)::integer AS cantidad_positivas,
    COUNT(*) FILTER (WHERE x.peso = 2)::integer AS cantidad_negativas,
    COUNT(*) FILTER (WHERE x.peso = 1)::integer AS cantidad_neutras,
    COALESCE(d.hex, '#6c757d')::text AS color
  FROM alumnos_respuestas_seleccion ars
  JOIN alumnos a
    ON a.alumno_id = ars.alumno_id
  JOIN preguntas p
    ON p.pregunta_id = ars.pregunta_id
  LEFT JOIN public.diagnostico d
    ON d.activo = true
   AND d.subcategoria = p.diagnostico
  JOIN respuestas_posibles_has_preguntas x
    ON x.pregunta_id = ars.pregunta_id
   AND x.respuesta_posible_id = ars.respuesta_posible_id
  WHERE (p_colegio_id IS NULL OR a.colegio_id = p_colegio_id)
    AND ars.tipo_concepto = p_tipo_concepto
    AND p.tipo_concepto = ars.tipo_concepto
    AND ars.fecha_pregunta <= p_fecha_hasta
    AND ars.activo = true
    AND ars.respondio = true
    AND a.activo = true
    AND p.activo = true
    AND x.activo = true
  GROUP BY COALESCE(d.subcategoria, p.diagnostico), COALESCE(d.hex, '#6c757d')
  HAVING COUNT(*) FILTER (WHERE x.peso = 2) > 0
  ORDER BY cantidad DESC;
$function$;
