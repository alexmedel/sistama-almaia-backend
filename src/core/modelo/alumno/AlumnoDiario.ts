import { BaseModel } from "../BaseModel";

export class AlumnoDiario extends BaseModel {
    alumno_diario_id?: number;
    alumno_id: number;
    titulo: string;
    descripcion: string;
    fecha: string;
    constructor(){
        super();
        this.alumno_id = 0;
        this.titulo = "";
        this.descripcion = "";
        this.fecha = new Date().toISOString();
    }
  }
  