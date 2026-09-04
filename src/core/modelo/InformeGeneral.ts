import { BaseModel } from "./BaseModel";

export class InformeGeneral extends BaseModel {
    informe_id?: number;
    tipo: string;
    nivel: string;
    fecha_generacion: Date;
    url_reporte: string;
    colegio_id: number;
    constructor(){
        super();
        this.tipo = "";
        this.nivel = "";
        this.fecha_generacion = new Date();
        this.url_reporte = "";
        this.colegio_id = 0;
    }
  }