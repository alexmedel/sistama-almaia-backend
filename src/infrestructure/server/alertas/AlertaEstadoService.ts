/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataService } from "../DataService";
import { AlertaEstado } from "../../../core/modelo/alerta/AlertaEstado";
import Joi from "joi";
import { SupabaseClient } from "@supabase/supabase-js";

const dataService: DataService<AlertaEstado> = new DataService("alertas_estado", "alerta_estado_id");
const AlertaEstadoSchema = Joi.object({
  nombre_alerta_estado: Joi.string().max(255).required(),
});
const AlertaEstadoUpdateSchema = Joi.object({
  nombre_alerta_estado: Joi.string().max(255).required(),
  activo: Joi.boolean().optional(),
});

export const AlertaEstadosService = {
  async obtener(queryParams: any, supabase?: SupabaseClient) {
    if (supabase) {
      dataService.setClient(supabase);
    }
    const { colegio_id, ...where } = queryParams;
    return await dataService.getAll(["*"], where);
  },

  async guardar(alertaEstadoData: any, creado_por: number, actualizado_por: number) {
    const { error: validationError } = AlertaEstadoSchema.validate(alertaEstadoData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const alertaEstado: AlertaEstado = {
      ...alertaEstadoData,
      creado_por,
      actualizado_por,
    };
    return await dataService.processData(alertaEstado);
  },

  async actualizar(id: number, alertaEstadoData: any, actualizado_por: number) {
    const { error: validationError } = AlertaEstadoUpdateSchema.validate(alertaEstadoData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const alertaEstado: AlertaEstado = {
      ...alertaEstadoData,
      actualizado_por,
      fecha_actualizacion: new Date().toISOString(),
    };
    await dataService.updateById(id, alertaEstado);
    return { message: "Alerta estado actualizada correctamente" };
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Alerta estado eliminada correctamente" };
  },
};
