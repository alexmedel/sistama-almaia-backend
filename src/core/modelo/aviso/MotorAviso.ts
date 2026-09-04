import { BaseModel } from "../BaseModel";

export class MotorAviso extends BaseModel {
    motor_aviso_id?: number;
    intervalo_min: number;
    constructor(){
        super();
        this.intervalo_min = 0;
    }
  }