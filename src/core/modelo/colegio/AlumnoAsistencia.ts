import { BaseModel } from "../BaseModel";

export class AlumnoAsistencia extends BaseModel {
    alumno_asistencia_id?: number;
    alumno_id: number;
    fecha_hora: Date;
    estado: string;
    justificacion: string;
    usuario_justifica: number;
    constructor(){
        super();
        this.alumno_id = 0;
        this.fecha_hora = new Date();
        this.estado = "";
        this.justificacion = "";
        this.usuario_justifica = 0;
    }
  }