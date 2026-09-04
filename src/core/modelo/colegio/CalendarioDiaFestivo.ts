import { BaseModel } from "../BaseModel";

export class CalendarioDiaFestivo extends BaseModel {
  calendario_dia_festivo?: number;
  calendario_escolar_id: number;
  dia_festivo: string;
  descripcion: string;
  constructor() {
    super();
    this.calendario_escolar_id = 0;
    this.dia_festivo = new Date().toISOString();
    this.descripcion = "";
  }
}
