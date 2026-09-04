// src/core/services/AlumnoInformeBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { AlumnoInforme } from "../../../../core/modelo/alumno/AlumnoInforme";
import { DataService } from "../../DataService";
import { AlumnoInformeSchema } from "../shemas/AlumnoInformeSchema";

const dataService: DataService<AlumnoInforme> = new DataService(
  "alumnos_informes",
  "alumno_informe_id"
);

export const AlumnoInformeBusiness = {
  /**
   * Obtiene la lista de informes de alumnos con sus relaciones.
   * @param where Filtros de la consulta.
   * @returns La lista de informes.
   */
  // async obtener(where: any) {
  //   return await dataService.getAll(
  //     [
  //       "*",
  //       "alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos),alumnos_cursos(alumno_curso_id,ano_escolar,cursos(curso_id,nombre_curso,colegios(colegio_id,nombre),grados(grado_id,nombre))))",
  //     ],
  //     where
  //   );
  // },
  async obtener(where: any = {}) {
    const filtros = { ...where, activo: true, generado: true };
    const data = await dataService.getAll(
      [
        "*",
        "alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos),alumnos_cursos(alumno_curso_id,ano_escolar,cursos(curso_id,nombre_curso,colegios(colegio_id,nombre),grados(grado_id,nombre))))",
      ],
      filtros
    );
    return (data as any[]).map((informe) => ({
      ...informe,
      fecha: informe.periodo_inicio ?? informe.fecha,
    }));
  },

  /**
   * Guarda un nuevo informe de alumno.
   * @param client Cliente de Supabase.
   * @param body Datos del informe.
   * @param metaData Metadatos de creación y actualización.
   * @returns El informe guardado.
   */
  async guardar(
    client: SupabaseClient,
    body: any,
    metaData: { creado_por: number; actualizado_por: number }
  ) {
    // 1. Validar primero los datos de entrada.
    const { error: validationError } = AlumnoInformeSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar la existencia del alumno.
    await this._verificarAlumnoExistencia(client, body.alumno_id);

    const alumnoInforme: AlumnoInforme = {
      ...body,
      creado_por: metaData.creado_por,
      actualizado_por: metaData.actualizado_por,
    };
    return await dataService.processData(alumnoInforme);
  },

  /**
   * Actualiza un informe de alumno por su ID.
   * @param client Cliente de Supabase.
   * @param id ID del informe a actualizar.
   * @param body Datos de actualización.
   * @param metaData Metadatos de actualización.
   * @returns Un mensaje de confirmación.
   */
  async actualizar(
    client: SupabaseClient,
    id: number,
    body: any,
    metaData: { actualizado_por: number }
  ) {
    // 1. Validar primero los datos de entrada.
    const { error: validationError } = AlumnoInformeSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar la existencia del alumno.
    await this._verificarAlumnoExistencia(client, body.alumno_id);

    const alumnoInforme = {
      ...body,
      actualizado_por: metaData.actualizado_por,
    };
    await dataService.updateById(id, alumnoInforme);
    return { message: "Informe del alumno actualizado correctamente" };
  },

  /**
   * Elimina un informe de alumno por su ID.
   * @param id ID del informe a eliminar.
   * @returns Un mensaje de confirmación.
   */
  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Informe del alumno eliminado correctamente" };
  },

  /**
   * Función auxiliar para verificar la existencia de un alumno.
   */
  async _verificarAlumnoExistencia(client: SupabaseClient, alumnoId: number) {
    const { data, error } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", alumnoId)
      .single();
    if (error || !data) {
      throw new Error("El alumno no existe.");
    }
  },
};
