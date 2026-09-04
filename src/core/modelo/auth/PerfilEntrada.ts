import { Colegio } from "../colegio/Colegio";
import { Idioma } from "../configuracion/Idioma";
import { FuncionalidadRol } from "./FuncionalidadRol";

 
interface PersonaEntrada {
  persona_id: number;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  genero_id: number;
  estado_civil_id: number;
  fecha_nacimiento:string;
  docentes: DocentesEntrada[];
  apoderados: any;
}

interface apoderados {
  colegio: string;
}

interface RolEntrada {
  funcionalidades_roles: FuncionalidadRol[];
  rol_id: number;
  nombre: string;
  descripcion: string;
}
interface UsuariosColegioEntrada {
   activo: boolean,
      rol_id: number,
      colegios: Colegio,
      colegio_id: number,
      creado_por: number,
      usuario_id: number,
      fecha_creacion:string,
      actualizado_por: number,
      fecha_asignacion: string,
      fecha_actualizacion:string,
      usuarios_colegio_id: number
}

interface DocentesEntrada {
  colegios: ColegiosEntrada
  docente_id: number
  especialidad: string
  docentes_cursos: DocentesCursosEntrada[]
}

export interface ColegiosEntrada {
  nombre: string
  colegio_id: number
  dependencia: string
  tipo_colegio: string
  nombre_fantasia: string
}

export interface DocentesCursosEntrada {
  cursos: CursosEntrada
  curso_id: number
  ano_escolar: number
}

export interface CursosEntrada {
  curso_id: number
  grado_id: number
  nombre_curso: string
}


export interface PerfilEntrada {
  funcionalidades_rol: FuncionalidadRol[];
   usuario_id: number;
  nombre_social: string;
  email: string;
  encripted_password: string;
  rol_id: number;
  telefono_contacto: string;
  ultimo_inicio_sesion: string;
  estado_usuario: string;
  intentos_inicio_sesion: number;
  url_foto_perfil: string | null;
  persona_id: number;
  creado_por: number;
  actualizado_por: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  idioma_id: number;
  auth_id: string;
  personas: PersonaEntrada;
  roles: RolEntrada;
  idiomas: Idioma;
  usuarios_colegios: UsuariosColegioEntrada[];
  colegio?: Colegio;
  apoderados?: any;
  alumnos?: any;
  nacionalidad_id?: number;
}