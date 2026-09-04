import { BaseModel } from "./BaseModel";

export class PersonaContacto extends BaseModel {
    persona_contacto_id: number;
    persona_id: number;
    telefono_contacto?: string;
    direccion: string;
    constructor(){
        super();
        this.persona_contacto_id = 0;
        this.persona_id = 0;
        this.direccion = "";
    }
  }