// src/core/services/AlumnoCursoBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
 
import { AlumnoCursoSchema } from "../../shema/AlumnoCursoSchema";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoCurso } from "../../../../../core/modelo/alumno/AlumnoCurso";
 

/**
 * Lógica de negocio para la gestión de cursos de alumnos.
 */
export const AlumnoCursoBusiness = {
    async obtener(client: SupabaseClient, query: any) {
        const { colegio_id, ...where } = query;
        if (colegio_id !== undefined) {
            return await obtenerRelacionados({
                tableFilter: "alumnos",
                filterField: "colegio_id",
                filterValue: colegio_id,
                idField: "alumno_id",
                tableIn: "alumnos_cursos",
                inField: "alumno_id",
                selectFields: `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email), cursos(curso_id,nombre_curso,colegios(colegio_id,nombre),grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))`,
            });
        }
        
        const { data, error } = await client
            .from("alumnos_cursos")
            .select(`
                *,
                alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email),
                cursos(curso_id,nombre_curso,colegios(colegio_id,nombre),grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))
            `)
            .match(where);
            
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async guardar(client: SupabaseClient, body: any, metaData: { creado_por: number; actualizado_por: number }) {
        // 1. Validar los datos de entrada al inicio.
        const { error: validationError, value } = AlumnoCursoSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }

        // 2. Verificar que el alumno y el curso existen.
        await this.verificarRelaciones(client, value);

        // 3. Preparar el objeto para la inserción.
        const alumnoCurso: AlumnoCurso = {
            ...value,
            creado_por: metaData.creado_por,
            actualizado_por: metaData.actualizado_por,
            activo: true
        };

        // 4. Insertar en la base de datos.
        const { data, error } = await client.from("alumnos_cursos").insert(alumnoCurso).single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
        // 1. Validar los datos de entrada al inicio.
        const { error: validationError, value } = AlumnoCursoSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }
        
        // 2. Verificar que el alumno y el curso existen.
        await this.verificarRelaciones(client, value);

        // 3. Preparar el objeto para la actualización.
        const alumnoCurso: AlumnoCurso = {
            ...value,
            actualizado_por: metaData.actualizado_por
        };
        
        // 4. Actualizar en la base de datos.
        const { data, error } = await client.from("alumnos_cursos").update(alumnoCurso).match({ alumno_curso_id: id });
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async eliminar(client: SupabaseClient, id: number) {
        const { error } = await client.from("alumnos_cursos").delete().match({ alumno_curso_id: id });
        if (error) {
            throw new Error(error.message);
        }
        return { message: "Curso del alumno eliminado correctamente" };
    },

      async verificarRelaciones(client: SupabaseClient, data: any) {
        // Función privada para verificar la existencia de entidades relacionadas.
        const { error: alumnoError } = await client.from("alumnos").select("alumno_id").eq("alumno_id", data.alumno_id).single();
        if (alumnoError) throw new Error("El alumno no existe.");

        const { error: cursoError } = await client.from("cursos").select("curso_id").eq("curso_id", data.curso_id).single();
        if (cursoError) throw new Error("El curso no existe.");
    }
};