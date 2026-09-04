import { BaseModel } from "../BaseModel";

export class MotorPregunta extends BaseModel {
  motor_pregunta_id?: number;
  dia_ejecucion: Date;
  constructor() {
    super();
    this.dia_ejecucion = new Date();
  }
}
