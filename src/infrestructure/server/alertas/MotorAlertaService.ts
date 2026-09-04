import { DataService } from "../DataService";
import { MotorAlerta } from "../../../core/modelo/alerta/MotorAlerta";
import Joi from "joi";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<MotorAlerta> = new DataService(
  "motores_alertas",
  "motor_alerta_id"
);

const MotorAlertaSchema = Joi.object({
  hr_ejecucion: Joi.string().max(5).required(),
  tipo: Joi.string().max(20).required(),
});

export const MotorAlertasService = {
  async obtener(where: any) {
    const motoresAlerta = await dataService.getAll(["*"], where);
    return motoresAlerta;
  },
  
  async guardar(motoralertaData: any, creado_por: number, actualizado_por: number) {
    const { error: validationError } = MotorAlertaSchema.validate(motoralertaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const motoralerta: MotorAlerta = {
      ...motoralertaData,
      creado_por,
      actualizado_por
    };
    const savedMotorAlerta = await dataService.processData(motoralerta);
    return savedMotorAlerta;
  },

  async actualizar(id: number, motoralertaData: any, actualizado_por: number) {
    const { error: validationError } = MotorAlertaSchema.validate(motoralertaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const motoralerta: MotorAlerta = {
      ...motoralertaData,
      actualizado_por
    };
    await dataService.updateById(id, motoralerta);
    return { message: "Motor de alerta actualizado correctamente" };
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Motor de alerta eliminado correctamente" };
  },

  async ejecutarMotor() {
    const { error } = await client.rpc('ejecutar_generacion_alertas_por_colegios');
    if (error) {
      console.error(error.message);
      throw new Error(`Error al ejecutar el motor de alertas: ${error.message}`);
    }
    return { message: "Motor de alertas ejecutado correctamente" };
  },
};
