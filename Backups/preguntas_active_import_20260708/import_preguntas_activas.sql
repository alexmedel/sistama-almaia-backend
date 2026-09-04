BEGIN;
\copy public.preguntas (pregunta_id,tipo_pregunta_id,nivel_educativo_id,diagnostico,sintomas,grupo_preguntas,palabra_clave,horario,texto_pregunta,creado_por,actualizado_por,fecha_creacion,activo,fecha_actualizacion,template_code,tipo_concepto,fecha_pregunta,quien_es,pregunta_grado_id) from 'C:/Users/USER/Documents/BE-Almaia/Backups/preguntas_active_import_20260708/preguntas_activas.csv' with (format csv, header true, encoding 'UTF8');
\copy public.respuestas_posibles_has_preguntas (respuesta_posible_id,pregunta_id,creado_por,actualizado_por,fecha_creacion,fecha_actualizacion,activo,peso) from 'C:/Users/USER/Documents/BE-Almaia/Backups/preguntas_active_import_20260708/respuestas_posibles_has_preguntas_activas.csv' with (format csv, header true, encoding 'UTF8');
select setval('public.preguntas_pregunta_id_seq', (select max(pregunta_id) from public.preguntas), true);
COMMIT;
