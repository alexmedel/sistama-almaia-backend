 
import { DataService } from "../DataService";
import { MotorInforme } from "../../../core/modelo/alerta/MotorInforme";
import Joi from "joi";

const dataService: DataService<MotorInforme> = new DataService(
  "motores_informes",
  "motor_informe_id"
);
const MotorInformeSchema = Joi.object({
  freq_meses: Joi.number().integer().required(),
  dia_ejecucion: Joi.number().integer().required(),
});

export const MotorInformesService = {
  async obtener(where: any) {
    return await dataService.getAll(["*"], where);
  },

  async guardar(motorInformeData: any, creado_por: number, actualizado_por: number) {
    const { error: validationError } = MotorInformeSchema.validate(motorInformeData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const motorinforme: MotorInforme = {
      ...motorInformeData,
      creado_por,
      actualizado_por,
    };
    return await dataService.processData(motorinforme);
  },

  async actualizar(id: number, motorInformeData: any, actualizado_por: number) {
    const { error: validationError } = MotorInformeSchema.validate(motorInformeData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const motorinforme: MotorInforme = {
      ...motorInformeData,
      actualizado_por,
    };
    await dataService.updateById(id, motorinforme);
    return { message: "Motor de informe actualizado correctamente" };
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Motor de informe eliminado correctamente" };
  },
};