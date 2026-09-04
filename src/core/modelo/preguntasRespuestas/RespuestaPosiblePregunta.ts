import { BaseModel } from "../BaseModel";

export class RespuestaPosiblePregunta extends BaseModel {
    respuesta_posible_id: number;
    pregunta_id: number;
    constructor(){
        super();
        this.respuesta_posible_id = 0;
        this.pregunta_id = 0;
    }
  }