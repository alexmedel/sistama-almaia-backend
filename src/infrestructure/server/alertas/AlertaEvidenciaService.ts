import { DataService } from "../DataService";
import { AlertaEvidencia } from "../../../core/modelo/alerta/AlertaEvidencia";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import { AlertaEvidenciaSchema } from "./shemas/AlertaEvidenciaSchema";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<AlertaEvidencia> = new DataService(
  "alumnos_alertas_evidencias",
  "alumno_alerta_evidencia_id"
);

export const AlertaEvidenciasService = {
  async obtener(where: any) {
    const alertaEvidencia = await dataService.getAll(
      [
        "*",
        "alumnos_alertas(alumno_alerta_id,fecha_generada,fecha_resolucion,accion_tomada,alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos)),alertas_reglas(alerta_regla_id,nombre),alertas_origenes(alerta_origen_id,nombre),alertas_severidades(alerta_severidad_id,nombre),alertas_prioridades(alerta_prioridad_id,nombre),alertas_tipos(alerta_tipo_id,nombre)))",
      ],
      where
    );
    return alertaEvidencia;
  },

  async guardar(alertaEvidenciaData: any, creado_por: number, actualizado_por: number) {
    const { error: validationError } = AlertaEvidenciaSchema.validate(alertaEvidenciaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const { data, error } = await client
      .from("alumnos_alertas")
      .select("*")
      .eq("alumno_alerta_id", alertaEvidenciaData.alumno_alerta_id)
      .single();
    if (error || !data) {
      throw new Error("La alerta del alumno no existe");
    }

    const alertaEvidencia: AlertaEvidencia = new AlertaEvidencia();
    Object.assign(alertaEvidencia, alertaEvidenciaData);
    alertaEvidencia.creado_por = creado_por;
    alertaEvidencia.actualizado_por = actualizado_por;
    
    return await dataService.processData(alertaEvidencia);
  },

  async actualizar(id: number, alertaEvidenciaData: any, actualizado_por: number) {
    const { error: validationError } = AlertaEvidenciaSchema.validate(alertaEvidenciaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const { data, error } = await client
      .from("alumnos_alertas")
      .select("*")
      .eq("alumno_alerta_id", alertaEvidenciaData.alumno_alerta_id)
      .single();
    if (error || !data) {
      throw new Error("La alerta del alumno no existe");
    }

    const alertaEvidencia: AlertaEvidencia = new AlertaEvidencia();
    Object.assign(alertaEvidencia, alertaEvidenciaData);
    alertaEvidencia.actualizado_por = actualizado_por;

    await dataService.updateById(id, alertaEvidencia);
    return alertaEvidencia;
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Alerta evidencia eliminada correctamente" };
  },
};
