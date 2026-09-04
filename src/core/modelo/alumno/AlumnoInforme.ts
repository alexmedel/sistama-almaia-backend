import { BaseModel } from "../BaseModel";

export class AlumnoInforme extends BaseModel {
    alumno_informe_id?: number;
    alumno_id: number;
    fecha: Date;
    url_reporte: string;
    constructor(){
        super();
        this.alumno_id = 0;
        this.fecha = new Date();
        this.url_reporte = "";
    }
  }