export const perfiles_query = [
  "*",
  "nacionalidades!nacionalidad_id(*)",
  "personas(apoderados(colegios(nombre)),  persona_id,tipo_documento,numero_documento,nombres,apellidos,genero_id,estado_civil_id,docentes(docente_id,especialidad,colegios(colegio_id,nombre,nombre_fantasia,tipo_colegio,dependencia),docentes_cursos(curso_id,ano_escolar,cursos(curso_id,nombre_curso,grado_id))),fecha_nacimiento)",
  "roles(rol_id,nombre,descripcion,funcionalidades_roles(*,funcionalidad_rol_id,funcionalidades(*,funcionalidad_id)))",
 
].join(",");

export const usuarios_query = [
  "*",
  "roles(rol_id,nombre)",
  "personas(persona_id,nombres,apellidos)",
  "idiomas(idioma_id,nombre)",
];
