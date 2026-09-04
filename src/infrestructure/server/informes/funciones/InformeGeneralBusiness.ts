// src/core/services/InformeGeneralBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { InformeGeneral } from "../../../../core/modelo/InformeGeneral";
import { DataService } from "../../DataService";
import { InformeGeneralSchema } from "../shemas/InformeGeneralSchema";

const dataService: DataService<InformeGeneral> = new DataService(
  "informes_generales"
);

export const InformeGeneralBusiness = {
  /**
   * Obtiene informes generales con filtros opcionales.
   * @param client Cliente de Supabase.
   * @param query Los filtros de la consulta.
   * @returns La lista de informes.
   */
  async obtener(client: SupabaseClient, query: any) {
    const { curso_id, colegio_id } = query;

    // Asegurar que cursosParam siempre sea un array o null
    let cursosParam = null;

    if (curso_id !== undefined && curso_id !== null) {
      if (typeof curso_id === "string") {
        cursosParam = [curso_id];
      } else if (Array.isArray(curso_id)) {
        cursosParam = curso_id;
      } else {
        // Si es un número u otro tipo, lo convertimos a array
        cursosParam = [curso_id];
      }
    }

    const { data, error } = await client.rpc("obtener_informes_con_cursos_v2", {
      colegio_id_param: colegio_id,
      cursos_param: cursosParam, // Usar cursosParam en lugar de [curso_id]
    });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Guarda un nuevo informe general.
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
    const { error: validationError } = InformeGeneralSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar la existencia del colegio.
    await this._verificarColegioExistencia(client, body.colegio_id);

    const informeGeneral: InformeGeneral = {
      ...body,
      creado_por: metaData.creado_por,
      actualizado_por: metaData.actualizado_por,
    };
    return await dataService.processData(informeGeneral);
  },

  /**
   * Actualiza un informe general por su ID.
   * @param client Cliente de Supabase.
   * @param informeId ID del informe a actualizar.
   * @param body Datos de actualización.
   * @param metaData Metadatos de creación y actualización.
   * @returns El informe actualizado.
   */
  async actualizar(
    client: SupabaseClient,
    informeId: number,
    body: any,
    metaData: { creado_por: number; actualizado_por: number }
  ) {
    // 1. Validar primero los datos de entrada.
    const { error: validationError } = InformeGeneralSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar la existencia del colegio.
    await this._verificarColegioExistencia(client, body.colegio_id);

    const informeGeneral = {
      ...body,
      actualizado_por: metaData.actualizado_por,
    };
    return await dataService.updateById(informeId, informeGeneral);
  },

  /**
   * Elimina un informe general por su ID.
   * @param informeId ID del informe a eliminar.
   */
  async eliminar(informeId: number) {
    await dataService.deleteById(informeId);
  },

  /**
   * Función auxiliar para verificar la existencia de un colegio.
   * @param client Cliente de Supabase.
   * @param colegioId ID del colegio.
   */
  async _verificarColegioExistencia(client: SupabaseClient, colegioId: number) {
    const { data, error } = await client
      .from("colegios")
      .select("colegio_id")
      .eq("colegio_id", colegioId)
      .single();
    if (error || !data) {
      throw new Error("El colegio no existe.");
    }
  },
  /**
   * Obtiene informes pendientes de alumnos, excluyendo plantillas no definidas.
   * @param client Cliente de Supabase.
   * @returns La lista de informes pendientes filtrados.
   */
  async obtenerInformesPendientes(client: SupabaseClient, colegioId?: number) {
    const { data, error } = await client.rpc("consultar_informes_pendientes", {
      p_colegio_id: colegioId ?? null,
    });
    if (error) {
      throw new Error(error.message);
    }

    // Filtrar para excluir 'NO_DEFINIDO_MATRIZ.docx' (como en tu consulta SQL)
    const informesFiltrados = (data || []).filter(
      (informe: any) => informe.template_informe !== "NO_DEFINIDO_MATRIZ.docx"
    );

    return informesFiltrados;
  },

  async obtenerInformesGradoPendientes(client: SupabaseClient, colegioId?: number) {
    const { data, error } = await client.rpc(
      "consultar_informes_grado_pendientes",
      { p_colegio_id: colegioId ?? null }
    );
    if (error) {
      throw new Error(error.message);
    }

    // Opcional: Filtrar si hay plantillas no definidas (ajusta si es necesario)
    // const informesFiltrados = (data || []).filter(
    //   (informe: any) => informe.template_informe !== 'NO_DEFINIDO_MATRIZ.docx'
    // );

    return data || [];
  },
  /**
   * Obtiene informes de curso pendientes.
   * @param client Cliente de Supabase.
   * @param colegioId ID del colegio (opcional).
   * @returns La lista de informes de curso pendientes.
   */
  async obtenerInformesCursoPendientes(client: SupabaseClient, colegioId?: number) {
    const { data, error } = await client.rpc(
      "consultar_informes_curso_pendientes",
      { p_colegio_id: colegioId ?? null }
    );
    if (error) {
      throw new Error(error.message);
    }

    // Opcional: Filtrar si hay plantillas no definidas (ajusta si es necesario)
    // const informesFiltrados = (data || []).filter(
    //   (informe: any) => informe.template_informe !== 'NO_DEFINIDO_MATRIZ.docx'
    // );

    return data || [];
  },

  /**
   * Obtiene informes de colegio pendientes.
   * @param client Cliente de Supabase.
   * @returns La lista de informes de colegio pendientes.
   */
  async obtenerInformesColegioPendientes(client: SupabaseClient) {
    const { data, error } = await client.rpc(
      "consultar_informes_colegio_pendientes"
    );
    if (error) {
      throw new Error(error.message);
    }

    // Opcional: Filtrar si hay plantillas no definidas (ajusta si es necesario)
    // const informesFiltrados = (data || []).filter(
    //   (informe: any) => informe.template_informe !== 'NO_DEFINIDO_MATRIZ.docx'
    // );

    return data || [];
  },
};
