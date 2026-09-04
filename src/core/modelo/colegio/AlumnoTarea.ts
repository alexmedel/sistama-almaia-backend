import { BaseModel } from "../BaseModel";

export class AlumnoTarea extends BaseModel {
    alumno_tarea?: number;
    alumno_id: number;
    fecha_programacion: Date;
    materia_id: number;
    color: string;
    tipo_tarea: string;
    descripcion_tarea: string;
    estado_tarea: string;
    constructor(){
        super();
        this.alumno_id = 0;
        this.fecha_programacion = new Date();
        this.materia_id = 0;
        this.color = '';
        this.tipo_tarea = '';
        this.descripcion_tarea = '';
        this.estado_tarea = '';
    }

  }