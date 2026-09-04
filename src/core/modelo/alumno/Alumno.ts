import { BaseModel } from "../BaseModel";

export class Alumno extends BaseModel {
    alumno_id?: number;
    colegio_id: number;
    url_foto_perfil?: string;
    telefono_contacto1?: string;
    email?: string;
    telefono_contacto2?: string;
    persona_id: number;
    cursos?: Array<
        {
            curso_id: number
        }
    >;
    constructor() {
        super();
        this.colegio_id = 0;
        this.persona_id = 0;
    }
}