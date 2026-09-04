import { BaseModel } from "../BaseModel";

export class AlumnoPermisoAutor extends BaseModel {
    alumno_permiso_autor_id?: number;
    alumno_id: number;
    apoderado_id: number;
    tipo: string;
    descripcion: string;
    fecha_solicitud: string;
    fecha_autorizacion: string;
    estado: string;
    constructor(){
        super();
        this.alumno_id = 0;
        this.apoderado_id = 0;
        this.tipo = "";
        this.descripcion = "";
        this.fecha_solicitud = new Date().toISOString();
        this.fecha_autorizacion = new Date().toISOString();
        this.estado = "";
    }
  }