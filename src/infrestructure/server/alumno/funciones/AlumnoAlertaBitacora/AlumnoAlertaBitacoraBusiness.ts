// src/core/services/AlumnoAlertaBitacoraBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";

import { randomUUID } from "crypto";
import { AlumnoAlertaBitacoraSchema } from "../../shema/AlumnoAlertaBitacoraSchema";
import { DataService } from "../../../DataService";
import { AlumnoAlertaBitacora } from "../../../../../core/modelo/alumno/AlumnoAlertaBitacora";
import {
  extractBase64Info,
  getExtensionFromMime,
  getURL,
  isBase64DataUrl,
} from "../../../../../core/services/ImagenServiceCasoUso";

const dataService: DataService<AlumnoAlertaBitacora> = new DataService(
  "alumnos_alertas_bitacoras",
  "alumno_alerta_bitacora_id"
);

/**
 * Encapsula la lógica de negocio para la gestión de bitácoras de alertas de alumnos.
 */
export const AlumnoAlertaBitacoraBusiness = {
  async obtener(client: SupabaseClient, query: any) {
    // La lógica del DataService es suficiente para este caso simple,
    // pero se mantiene aquí para la consistencia.
    return await dataService.getAll(
      ["*,alumnos_alertas(*,responsable:personas(*))"],
      query
    );
  },

  async guardar(
    client: SupabaseClient,
    body: any,
    metaData: { creado_por: number; actualizado_por: number },
    supabaseClientFile: SupabaseClient
  ) {
    // 1. Validar los datos de entrada al inicio.
    const { error: validationError, value } =
      AlumnoAlertaBitacoraSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar existencia de entidades relacionadas (alumno y alerta).
    await this._verificarEntidades(
      client,
      value.alumno_id,
      value.alumno_alerta_id
    );

    // 3. Subir archivo si es base64 y actualizar el URL.
    if (value.url_archivo) {
      value.url_archivo = await this._subirArchivo(
        supabaseClientFile,
        value.url_archivo
      );
    }

    // 4. Actualizar campos de la alerta principal si están presentes.
    await this._actualizarAlerta(client, value.alumno_alerta_id, body);

    // 5. Preparar el objeto para la inserción.
    const alumnoAlertaBitacora: AlumnoAlertaBitacora = {
      ...value,
      creado_por: metaData.creado_por,
      actualizado_por: metaData.actualizado_por,
      fecha_creacion: new Date(),
      activo: true
    };

    // 6. Guardar la bitácora.
    return await dataService.processData(alumnoAlertaBitacora);
  },

  async actualizar(
    client: SupabaseClient,
    id: number,
    body: any,
    metaData: { actualizado_por: number },
    supabaseClientFile: SupabaseClient
  ) {
    // 1. Validar los datos de entrada al inicio con Joi.
    const { error: validationError, value } =
      AlumnoAlertaBitacoraSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    } // 2. Verificar la existencia de la bitácora.

    const { data: existingBitacora, error: bitacoraError } = await client
      .from("alumnos_alertas_bitacoras")
      .select("alumno_alerta_bitacora_id")
      .eq("alumno_alerta_bitacora_id", id)
      .single();
    if (bitacoraError || !existingBitacora) {
      throw new Error("La bitácora no existe."); // El controlador debe mapear este error a un 404.
    } // 3. Subir archivo si es base64 y actualizar el URL.

    if (value.url_archivo) {
      value.url_archivo = await this._subirArchivo(
        supabaseClientFile,
        value.url_archivo
      );
    } // 4. Preparar el objeto para la actualización.

    const alumnoAlertaBitacora = {
      ...value,
      actualizado_por: metaData.actualizado_por,
      fecha_actualizacion: new Date(),
    }; // 5. Actualizar la bitácora.

    await dataService.updateById(id, alumnoAlertaBitacora);
    return { message: "Alumno Alerta Bitácora actualizada correctamente" };
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Alumno Alerta Bitácora eliminada correctamente" };
  },

  // --- Funciones auxiliares privadas para encapsular la lógica ---

  async _subirArchivo(
    client_file: SupabaseClient,
    base64Url: string
  ): Promise<string> {
    if (!isBase64DataUrl(base64Url)) {
      return base64Url; // No es base64, retorna el mismo URL
    }
    const { mimeType, base64Data } = extractBase64Info(base64Url);
    const buffer = Buffer.from(base64Data, "base64");
    const extension = getExtensionFromMime(mimeType);
    const fileName = `${randomUUID()}.${extension}`;

    const { error } = await client_file.storage
      .from("bitacoras")
      .upload(`documents/${fileName}`, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    if (error) {
      throw new Error(`Error al subir el archivo: ${error.message}`);
    }
    return getURL(client_file, "bitacoras", `documents/${fileName}`);
  },

  async _verificarEntidades(
    client: SupabaseClient,
    alumnoId: number,
    alertaId: number
  ) {
    const { data: alumno, error: errorAlumno } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", alumnoId)
      .single();
    if (errorAlumno || !alumno) {
      throw new Error("El alumno no existe.");
    }

    const { data: alerta, error: errorAlerta } = await client
      .from("alumnos_alertas")
      .select("alumno_alerta_id")
      .eq("alumno_alerta_id", alertaId)
      .single();
    if (errorAlerta || !alerta) {
      throw new Error("La alerta no existe.");
    }
  },

  async _actualizarAlerta(client: SupabaseClient, alertaId: number, body: any) {
    const updateData: Record<string, any> = {};
    if (body.alerta_prioridad_id !== undefined)
      updateData.prioridad_id = body.alerta_prioridad_id;
    if (body.alerta_reveridad_id !== undefined)
      updateData.severidad_id = body.alerta_reveridad_id;
    if (body.responsable_id !== undefined)
      updateData.responsable_actual_id = body.responsable_id;

    if (Object.keys(updateData).length > 0) {
      const { error } = await client
        .from("alumnos_alertas")
        .update(updateData)
        .eq("alumno_alerta_id", alertaId);
      if (error) {
        throw new Error(`Error al actualizar la alerta: ${error.message}`);
      }
    }
  },
};
