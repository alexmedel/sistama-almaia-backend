import { BaseModel } from "../BaseModel";

export class Docente extends BaseModel {
    docente_id?: number;
    persona_id: number;
    colegio_id: number;
    especialidad: string;
    estado: string;
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    genero_id: number;
    estado_civil_id: number;
    fecha_nacimiento:Date;
    constructor(){
        super();
        this.persona_id = 0;
        this.colegio_id = 0;
        this.especialidad = "";
        this.estado = "";
        this.tipo_documento = '';
        this.numero_documento = '';
        this.nombres = '';
        this.apellidos = '';
        this.genero_id = 0;
        this.estado_civil_id = 0;
        this.fecha_nacimiento = new Date();
    }
  
  }