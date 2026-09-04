import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";

import { AlumnoAlerta } from "../../../../../core/modelo/alumno/AlumnoAlerta";
import { saveAudio, saveImage } from "../../../../../helpers/upload-supabase";
import { AlumnoAlertaUpdateSchema } from "../../shema/AlumnoAlertaSchema";
import { DataService } from "../../../DataService";

//validaciones
export const getDestinatarios = async (
  client: SupabaseClient,
  alumno_id: number,
  tipoAlertaId: number
):Promise<{destinatarios:string[], colegio_id:number}> => { 
  const { data, error } = await client
    .from("alumnos")
    .select("colegio_id")
    .eq("alumno_id", alumno_id)
    .single();

  if (error || !data) throw new Error("El alumno no existe");
  //correo_electronico
  let emailField = "";
  console.log('tipoAlertaId destinario', tipoAlertaId);
   
   

  if (Number(tipoAlertaId) === 1){
     emailField = "correo_sos";
     console.log('paso por aqui 2', emailField);
  }

  if (Number(tipoAlertaId) === 2) {
    
    emailField = "correo_denuncia";
    console.log('paso por aqui 2', emailField);
  }

  const { data: dataColegio, error: errorColegio } = (await client
    .from("colegios")
    .select(emailField)
    .eq("colegio_id", data.colegio_id)
    .single()) as { data: any; error: PostgrestError | null };
  
  console.log('data destinatarios recuperados');
  console.log(dataColegio);  
  console.log('emailField', emailField);
  console.log(dataColegio[emailField]);
  console.log(tipoAlertaId);
  if (!errorColegio && dataColegio[emailField]) {
    const destinatario:string[] = dataColegio[emailField]
      .split(",")
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    return {
      destinatarios: destinatario ,
      colegio_id: data.colegio_id,
    };
  }

  return {
    destinatarios: ["app@almaia.cl"],
    colegio_id: 1,
  }; // fallback
};

export const validarReferencias = async (
  client: SupabaseClient,
  alerta: AlumnoAlerta
) => {
  const checks = [
    {
      table: "alertas_reglas",
      key: "alerta_regla_id",
      value: alerta.alerta_regla_id,
      msg: "La regla no existe",
    },
    {
      table: "alertas_origenes",
      key: "alerta_origen_id",
      value: alerta.alerta_origen_id,
      msg: "El origen no existe",
    },
    {
      table: "alertas_prioridades",
      key: "alerta_prioridad_id",
      value: alerta.prioridad_id,
      msg: "La prioridad no existe",
    },
    {
      table: "alertas_severidades",
      key: "alerta_severidad_id",
      value: alerta.severidad_id,
      msg: "La severidad no existe",
    },
    {
      table: "alertas_tipos",
      key: "alerta_tipo_id",
      value: alerta.alertas_tipo_alerta_tipo_id,
      msg: "El tipo de alerta no existe",
    },
  ];

  const activeChecks = checks.filter((check) => check.value !== undefined);

  await Promise.all(
    activeChecks.map(async (check) => {
      const { data, error } = await client
        .from(check.table)
        .select("*")
        .eq(check.key, check.value)
        .single();

      if (error || !data) throw new Error(check.msg);
    })
  );
};
export const procesarArchivos = async (
  client: SupabaseClient,
  req: Request,
  alerta: AlumnoAlerta
) => {
  const [imageUrl, audioUrl] = await Promise.all([
    saveImage(client, req),
    saveAudio(client, req),
  ]);

  if (imageUrl) alerta.url_image = imageUrl;
  if (audioUrl) alerta.url_audio = audioUrl;
};

export const actualizarAlumnoAlerta = async (
  id: number,
  req: Request,
  client: SupabaseClient,
  dataService: DataService<Partial<AlumnoAlerta>>
): Promise<AlumnoAlerta> => {
  const { cambiar_lectura } = req.query;

  // 🔹 Caso 1: actualizar solo lectura
  if (cambiar_lectura !== undefined) {
    const { data, error } = await client
      .from("alumnos_alertas")
      .update({ leida: req.body.leida })
      .eq("alumno_alerta_id", id)
      .select("*")
      .single();

    if (error) throw new Error(`Error al actualizar lectura: ${error.message}`);
    return data as AlumnoAlerta;
  }

  // 🔹 Caso 2: actualización completa
  const alumnoalerta: AlumnoAlerta = new AlumnoAlerta();
  const info = {
    alumno_id: req.body.alumno_id,
    alerta_regla_id: req.body.alerta_regla_id,
    mensaje: req.body.mensaje,
    fecha_resolucion: req.body.fecha_resolucion,
    prioridad_id: req.body.prioridad_id,
    responsable_actual_id: req.body.responsable_actual_id,
    severidad_id: req.body.severidad_id,
    accion_tomada: req.body.accion_tomada ?? null,
    leida: req.body.leida,
    estado: req.body.estado,
    //alertas_tipo_alerta_tipo_id: req.body.alertas_tipos?.alerta_tipo_id,
  };

  Object.assign(alumnoalerta, info);
  alumnoalerta.actualizado_por = req.actualizado_por;

  // 1️⃣ Validación de esquema
  const { error: validationError } = AlumnoAlertaUpdateSchema.validate(info);
  if (validationError) throw new Error(validationError.details[0].message);

  // 2️⃣ Verificar existencia del registro
  const { data: dataAlumnoAlerta, error: errorAlumnoAlerta } = await client
    .from("alumnos_alertas")
    .select("*")
    .eq("alumno_alerta_id", id)
    .single();

  if (errorAlumnoAlerta || !dataAlumnoAlerta)
    throw new Error("El alumno alerta no existe");

  // Mantener valores originales
  alumnoalerta.alertas_tipo_alerta_tipo_id =
    dataAlumnoAlerta.alertas_tipo_alerta_tipo_id;
  alumnoalerta.alerta_origen_id = dataAlumnoAlerta.alerta_origen_id;
  alumnoalerta.fecha_generada = dataAlumnoAlerta.fecha_generada;

  // 3️⃣ Validar referencias
  await validarReferencias(client, alumnoalerta);

  // 4️⃣ Procesar archivos
  await procesarArchivos(client, req, alumnoalerta);

  // 5️⃣ Guardar cambios (sin permitir cambiar tipo)
  const { alertas_tipo_alerta_tipo_id, ...rest } = alumnoalerta;
  await dataService.updateById(id, rest);

  // Devuelvo el objeto final actualizado
  return { ...dataAlumnoAlerta, ...rest } as AlumnoAlerta;
};
