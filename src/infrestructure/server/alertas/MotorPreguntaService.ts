import { DataService } from "../DataService";
import { MotorPregunta } from "../../../core/modelo/alerta/MotorPregunta";
import Joi from "joi";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdminService = new SupabaseAdminService();
const adminClient: SupabaseClient = supabaseAdminService.getClient();
const dataService: DataService<MotorPregunta> = new DataService(
  "motores_preguntas",
  "motor_pregunta_id"
);

const MotorPreguntaSchema = Joi.object({
  dia_ejecucion: Joi.string().required(),
});

export const MotorPreguntasService = {
  async obtener(where: any) {
    return await dataService.getAll(["*"], where);
  },

  async guardar(motorPreguntaData: any, creado_por: number, actualizado_por: number) {
    const { error: validationError } = MotorPreguntaSchema.validate(motorPreguntaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const motorpregunta: MotorPregunta = {
      ...motorPreguntaData,
      creado_por,
      actualizado_por,
    };
    return await dataService.processData(motorpregunta);
  },

  async actualizar(id: number, motorPreguntaData: any, actualizado_por: number) {
    const { error: validationError } = MotorPreguntaSchema.validate(motorPreguntaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const motorpregunta: MotorPregunta = {
      ...motorPreguntaData,
      actualizado_por,
    };
    await dataService.updateById(id, motorpregunta);
    return { message: "Motor de pregunta actualizado correctamente" };
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Motor de pregunta eliminado correctamente" };
  },

  async ejecutarMotor(colegio_id: number) {
    const { error } = await adminClient.rpc('generar_preguntas_alumnos', {
      p_colegio_id: colegio_id,
    });
    if (error) {
      console.error(error.message);
      throw new Error(`Error al ejecutar el motor de preguntas: ${error.message}`);
    }
    return { message: "Motor de preguntas ejecutado correctamente" };
  },
};
