import { FuncionalidadRol } from "../modelo/auth/FuncionalidadRol";
import { Perfil } from "../modelo/auth/Perfil";
import { PerfilEntrada } from "../modelo/auth/PerfilEntrada";

export function mapearDatos(data: PerfilEntrada): Perfil {
  console.log(data.personas);
  return {
    usuario: {
      colegio: data.personas.apoderados?.[0]?.colegios?.nombre ?? "",
      usuario_id: data.usuario_id,
      nombre_social: data.nombre_social,
      email: data.email,
      telefono_contacto: data.telefono_contacto,
      ultimo_inicio_sesion: data.ultimo_inicio_sesion,
      intentos_inicio_sesion: data.intentos_inicio_sesion,
      estado_usuario: data.estado_usuario,
      url_foto_perfil: data.url_foto_perfil,
      persona_id: data.persona_id,
      rol_id: data.rol_id,
      idioma_id: data.idioma_id,
      nacionalidad_id: Number(data.nacionalidad_id ?? 0),
    },
    persona: {
      persona_id: data.personas.persona_id,
      tipo_documento: data.personas.tipo_documento,
      numero_documento: data.personas.numero_documento,
      nombres: data.personas.nombres,
      apellidos: data.personas.apellidos,
      genero_id: data.personas.genero_id,
      estado_civil_id: data.personas.estado_civil_id,
      fecha_nacimiento: data.personas.fecha_nacimiento,
    },
    rol: {
      rol_id: data.roles.rol_id,
      nombre: data.roles.nombre,
      descripcion: data.roles.descripcion,
    },
    docentes:
      Array.isArray(data.personas.docentes) && data.personas.docentes.length > 0
        ? data.personas.docentes.map((docente) => ({
            docente_id: docente.docente_id,
            especialidad: docente.especialidad,
            colegios: docente.colegios,
            docentes_cursos: docente.docentes_cursos.map((dc) => ({
              // curso_id: dc.curso_id,
              ano_escolar: dc.ano_escolar,
              cursos: {
                curso_id: dc.cursos.curso_id,
                grado_id: dc.cursos.grado_id,
                nombre_curso: dc.cursos.nombre_curso,
              },
            })),
          }))
        : [],
    funcionalidades: mapearFuncionalidades(data.roles.funcionalidades_roles),
  };
}
export function mapearDatosAlumno(data: PerfilEntrada): Perfil {
  return {
    usuario: {
      usuario_id: data.usuario_id,
      nombre_social: data.nombre_social,
      email: data.email,
      telefono_contacto: data.telefono_contacto,
      ultimo_inicio_sesion: data.ultimo_inicio_sesion,
      intentos_inicio_sesion: data.intentos_inicio_sesion,
      estado_usuario: data.estado_usuario,
      url_foto_perfil: data.url_foto_perfil,
      persona_id: data.persona_id,
      rol_id: data.rol_id,
      idioma_id: data.idioma_id,
      idioma: data.idiomas,
      
    },
    persona: {
      persona_id: data.personas.persona_id,
      tipo_documento: data.personas.tipo_documento,
      numero_documento: data.personas.numero_documento,
      nombres: data.personas.nombres,
      apellidos: data.personas.apellidos,
      genero_id: data.personas.genero_id,
      estado_civil_id: data.personas.estado_civil_id,
      fecha_nacimiento: data.personas.fecha_nacimiento,
    },
    rol: {
      rol_id: data.roles.rol_id,
      nombre: data.roles.nombre,
      descripcion: data.roles.descripcion,
    },
    funcionalidades: mapearFuncionalidades(data.roles.funcionalidades_roles),
  };
}
function mapearFuncionalidades(funcionalidades_roles: FuncionalidadRol[]) {
  return funcionalidades_roles.map((fr) => ({
    id: fr.funcionalidad_id,
    nombre: fr.funcionalidades?.nombre,
    descripcion: fr.funcionalidades?.descripcion,
  }));
}
