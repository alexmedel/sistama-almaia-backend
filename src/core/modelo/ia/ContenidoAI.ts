import { BaseModel } from "../BaseModel";

export class ContenidoAI extends BaseModel {
    contenido_ai_id: number;
    tipo: string;
    tema: string;
    url_recurso: string;
    constructor(){
        super();
        this.contenido_ai_id = 0;
        this.tipo = "";
        this.tema = "";
        this.url_recurso = "";
        this.creado_por = 0;
        this.actualizado_por = 0;
    }
  }
  