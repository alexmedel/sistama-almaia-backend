import { BaseModel } from "../BaseModel";

export class MotorAlerta extends BaseModel {
    motor_alerta_id?: number;
    hr_ejecucion: string;
    tipo: string;
    constructor(){
        super();
        this.hr_ejecucion = "";
        this.tipo = "";
    }
  }