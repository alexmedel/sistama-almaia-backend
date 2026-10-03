import { Request, Response } from "express";



// SELECT
//   a.*,
//   COALESCE(rel.apoderados, '[]'::jsonb) AS apoderados,
//   COALESCE(jsonb_array_length(rel.apoderados) > 0, false) AS tiene_apoderado
// FROM public.alumnos AS a
// LEFT JOIN LATERAL (
//   SELECT jsonb_agg(
//     jsonb_build_object(
//       'alumno_apoderado_id', aa.alumno_apoderado_id,
//       'tipo_apoderado', aa.tipo_apoderado,
//       'apoderado_id', ap.apoderado_id,
//       'persona_id', p.persona_id,
//       'nombres', p.nombres,
//       'apellidos', p.apellidos
//     )
//   ) FILTER (WHERE ap.apoderado_id IS NOT NULL) AS apoderados
//   FROM public.alumnos_apoderados AS aa
//   LEFT JOIN public.apoderados AS ap
//     ON ap.apoderado_id = aa.apoderado_id
//   LEFT JOIN public.personas AS p
//     ON p.persona_id = ap.persona_id
//   WHERE aa.alumno_id = a.alumno_id
// ) AS rel ON true
// WHERE a.colegio_id = 22
// ORDER BY a.alumno_id;
export const AlumnosApoderadosColegioController = {
  async obtener(req: Request, res: Response) {
    const colegioId = Number(req.params.colegio_id);
    if (!Number.isInteger(colegioId) || colegioId <= 0) {
      res
        .status(400)
        .json({ message: "El colegio_id debe ser un entero positivo" });
      return;
    }

    const supabase = req.supabase;
    try {
      const { data, error } = await supabase
        .from("alumnos")
        .select(
          `
          alumno_id,
          colegio_id,
          persona_id,
          url_foto_perfil,
          telefono_contacto1,
          telefono_contacto2,
          email,
          activo,
          personas(persona_id,nombres,apellidos),
          alumnos_apoderados(
            alumno_apoderado_id,
            tipo_apoderado,
            activo,
            apoderados(
              apoderado_id,
              persona_id,
              telefono_contacto1,
              telefono_contacto2,
              email_contacto1,
              email_contacto2,
              personas(persona_id,nombres,apellidos)
            )
          ),
          alumnos_cursos(
            activo,
            cursos(
              curso_id,
              nombre_curso,
              grados(grado_id,nombre)
            )
          )
        `,
        )
        .eq("colegio_id", colegioId)
        .eq("alumnos_cursos.activo", true)
        .order("alumno_id", { ascending: true });

      if (error) {
        throw new Error(
          `Error obteniendo alumnos y apoderados: ${error.message}`,
        );
      }

      const alumnos = data ?? [];
      const alumnosPorGrado = new Map<
        number,
        { grado_id: number; grado: string; alumnoIds: Set<number> }
      >();

      for (const alumno of alumnos as any[]) {
        for (const alumnoCurso of alumno.alumnos_cursos ?? []) {
          const grado = alumnoCurso.cursos?.grados;
          const gradoId = Number(grado?.grado_id);
          if (!Number.isInteger(gradoId)) continue;

          if (!alumnosPorGrado.has(gradoId)) {
            alumnosPorGrado.set(gradoId, {
              grado_id: gradoId,
              grado: grado?.nombre ?? "Sin nombre",
              alumnoIds: new Set<number>(),
            });
          }
          alumnosPorGrado.get(gradoId)!.alumnoIds.add(Number(alumno.alumno_id));
        }
      }

      const alumnosSinApoderado = (alumnos as any[])
        .filter(
          (alumno) =>
            !Array.isArray(alumno.alumnos_apoderados) ||
            alumno.alumnos_apoderados.length === 0,
        )
        .map((alumno) => alumno.alumno_id);

      res.status(200).json({
        metricas: {
          cantidad_alumnos_cargados: alumnos.length,
          alumnos_por_grado: Array.from(alumnosPorGrado.values())
            .map(({ alumnoIds, ...grado }) => ({
              ...grado,
              cantidad_alumnos: alumnoIds.size,
            }))
            .sort((a, b) => a.grado_id - b.grado_id),
          alumnos_sin_apoderado: alumnosSinApoderado,
        },
        alumnos,
      });
    } catch (error: any) {
      console.error(
        "Error al obtener alumnos y apoderados del colegio:",
        error,
      );
      res.status(500).json({
        message: error?.message || "Error interno del servidor",
      });
    }
  },
};
