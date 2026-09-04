import { BaseModel } from "../BaseModel";

export class CalendarioEscolar extends BaseModel {
    calendario_escolar_id?: number;
    colegio_id: number;
    ano_escolar: number;
    fecha_inicio: string;
    fecha_fin: string;
    dias_habiles: number;
    constructor(){
        super();
        this.colegio_id = 0;
        this.ano_escolar = 0;
        this.fecha_inicio = new Date().toISOString();
        this.fecha_fin = new Date().toISOString();
        this.dias_habiles = 0;
    }
  }