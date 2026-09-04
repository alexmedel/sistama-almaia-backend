// src/core/services/DocenteCursoBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { DocenteCurso } from "../../../../core/modelo/colegio/DocenteCurso";
import { DataService } from "../../DataService";
import { DocenteCursoSchema } from "../shema/DocenteCursoSchema";
 

const dataService: DataService<DocenteCurso> = new DataService(
  "docentes_cursos"
);

export const DocenteCursoBusiness = {
  /**
   * Obtiene la lista de docentes-cursos con sus relaciones.
   * @param where Filtros de la consulta.
   * @returns Lista de docentes-cursos.
   */
  async obtener(where: any) {
    return await dataService.getAll([
      "*",
      "docentes(docente_id,especialidad,personas(persona_id,nombres,apellidos))",
      "cursos(curso_id,nombre_curso,colegios(colegio_id,nombre),grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))",
    ], where);
  },

  /**
   * Guarda una nueva asignación de docente a curso.
   * @param client Cliente de Supabase.
   * @param body Datos de la asignación.
   * @param metaData Metadatos de creación.
   * @returns La asignación guardada.
   */
  async guardar(client: SupabaseClient, body: any, metaData: { creado_por: number; actualizado_por: number }) {
    // 1. Validar los datos de entrada al inicio.
    const { error: validationError } = DocenteCursoSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    
    // 2. Verificar existencia de dependencias.
    await this._verificarExistencia(client, body.docente_id, body.curso_id);

    const docenteCurso: DocenteCurso = {
      ...body,
      creado_por: metaData.creado_por,
      actualizado_por: metaData.actualizado_por,
    };
    return await dataService.processData(docenteCurso);
  },

  /**
   * Actualiza una asignación de docente a curso.
   * @param client Cliente de Supabase.
   * @param id ID de la asignación.
   * @param body Datos de actualización.
   * @param metaData Metadatos de actualización.
   * @returns Un mensaje de confirmación.
   */
  async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
    // 1. Validar los datos de entrada al inicio.
    const { error: validationError } = DocenteCursoSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar existencia de dependencias.
    await this._verificarExistencia(client, body.docente_id, body.curso_id);
    
    const docenteCurso  = {
      ...body,
      actualizado_por: metaData.actualizado_por,
    };
    await dataService.updateById(id, docenteCurso);
    return { message: "Asignación de docente a curso actualizada correctamente" };
  },

  /**
   * Elimina una asignación por su ID.
   * @param id ID de la asignación a eliminar.
   * @returns Un mensaje de confirmación.
   */
  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Asignación de docente a curso eliminada correctamente" };
  },

  /**
   * Función auxiliar para verificar la existencia de docente y curso.
   */
    async _verificarExistencia(client: SupabaseClient, docenteId: number, cursoId: number) {
    const { data: docenteData, error: docenteError } = await client
      .from("docentes")
      .select("docente_id")
      .eq("docente_id", docenteId)
      .single();
    if (docenteError || !docenteData) {
      throw new Error("El docente no existe.");
    }

    const { data: cursoData, error: cursoError } = await client
      .from("cursos")
      .select("curso_id")
      .eq("curso_id", cursoId)
      .single();
    if (cursoError || !cursoData) {
      throw new Error("El curso no existe.");
    }
  }
};