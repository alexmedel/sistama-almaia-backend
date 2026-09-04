import { BaseModel } from "../BaseModel";

export class Aula extends BaseModel {
    aula_id?: number;
    curso_id: number;
    colegio_id: number;
    materia_id: number;
    docente_id: number;
    tipo_docente: string;
    constructor(){
        super();
        this.curso_id = 0;
        this.colegio_id = 0;
        this.materia_id = 0;
        this.docente_id = 0;
        this.tipo_docente = "";
    }
  }