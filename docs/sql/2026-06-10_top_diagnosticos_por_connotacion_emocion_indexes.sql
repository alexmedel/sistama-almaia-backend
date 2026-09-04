create unique index if not exists idx_diagnostico_emocion_map_diagnostico_id
on public.diagnostico_emocion_map (diagnostico_id);

create index if not exists idx_alumnos_activo_colegio_alumno
on public.alumnos (colegio_id, alumno_id)
where activo is true;

create index if not exists idx_ars_emociones_top_diag
on public.alumnos_respuestas_seleccion (fecha_pregunta, alumno_id, pregunta_id, respuesta_posible_id)
where activo is true
  and respondio is true
  and tipo_concepto = 'Emociones';
