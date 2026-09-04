export const alumnopermisoautorQuery = [
  "*",
  "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))",
  "apoderados(apoderado_id,personas(persona_id,nombres,apellidos),telefono_contacto1,telefono_contacto2,email_contacto1,email_contacto2)",
];
