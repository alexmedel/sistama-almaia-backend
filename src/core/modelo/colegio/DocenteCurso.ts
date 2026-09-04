import { BaseModel } from "../BaseModel";

export class DocenteCurso extends BaseModel {
    docente_curso_id?: number;
    docente_id: number;
    curso_id: number;
    ano_escolar: number;
    constructor(){
        super();
        this.docente_id = 0;
        this.curso_id = 0;
        this.ano_escolar = 0;
    }
  }