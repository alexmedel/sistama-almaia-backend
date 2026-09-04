import { Colegio } from "../colegio/Colegio";
import { Idioma } from "../configuracion/Idioma";

 
export type Perfil = {
  usuario: {
    usuario_id: number;
    nombre_social: string;
    email: string;
    telefono_contacto: string;
    ultimo_inicio_sesion: string;
    intentos_inicio_sesion:number;
    estado_usuario: string;
    url_foto_perfil: string | null;
    persona_id: number;
    rol_id: number;
    colegio?:string;
    idioma?:Idioma;
    idioma_id: number;
    nacionalidad_id?: number;
    nacionalidad?:any;
  };
  persona: {
    persona_id: number;
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    genero_id: number;
    estado_civil_id: number;
    fecha_nacimiento:string;
  };
  docentes?: any[]
  rol: {
    rol_id: number;
    nombre: string;
    descripcion: string;
  };
  funcionalidades: any[];
  colegio?:string;
  
};


