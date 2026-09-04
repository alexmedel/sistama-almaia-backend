import { BaseModel } from "../BaseModel";

export class ApoderadoRespuesta extends BaseModel {
  apoderado_respuesta_id?: number;
  alumno_id: number;
  apoderado_id: number;
  pregunta_id: number;
  respuesta_posible_id?: number;
  texto_respuesta: string;
  estado_respuesta:string;
  constructor() {
    super();
    this.alumno_id = 0;
    this.apoderado_id = 0;
    this.pregunta_id = 0;
    this.texto_respuesta = "";
    this.estado_respuesta = "";
  }
}
