// src/core/services/AlumnoAntecedenteFamiliarBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
 import { AlumnoAntecedenteFamiliarSchema } from "../../shema/AlumnoAntecedenteFamiliarSchema";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoAntecedenteFamiliar } from "../../../../../core/modelo/alumno/AlumnoAntecedenteFamiliar";
 

/**
 * Lógica de negocio para la gestión de antecedentes familiares de alumnos.
 */
export const AlumnoAntecedenteFamiliarBusiness = {
    async obtener(client: SupabaseClient, query: any) {
        const { colegio_id, ...where } = query;
        if (colegio_id !== undefined) {
            return await obtenerRelacionados({
                tableFilter: "alumnos",
                filterField: "colegio_id",
                filterValue: colegio_id,
                idField: "alumno_id",
                tableIn: "alumnos_ant_familiares",
                inField: "alumno_id",
                selectFields: `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))`
            });
        }
        
        const { data, error } = await client
            .from("alumnos_ant_familiares")
            .select(`
                *,
                alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))
            `)
            .match(where);
            
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async guardar(client: SupabaseClient, body: any, metaData: { creado_por: number; actualizado_por: number }) {
        // 1. Validar los datos de entrada al inicio.
        const { error: validationError, value } = AlumnoAntecedenteFamiliarSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }

        // 2. Verificar que el alumno existe.
        await this.verificarAlumno(client, value.alumno_id);

        // 3. Preparar el objeto para la inserción.
        const antecedente: AlumnoAntecedenteFamiliar = {
            ...value,
            creado_por: metaData.creado_por,
            actualizado_por: metaData.actualizado_por,
            activo: true
        };

        // 4. Insertar en la base de datos.
        const { data, error } = await client.from("alumnos_ant_familiares").insert(antecedente).single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
        // 1. Validar los datos de entrada al inicio.
        const { error: validationError, value } = AlumnoAntecedenteFamiliarSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }
        
        // 2. Verificar que el alumno existe.
        await this.verificarAlumno(client, value.alumno_id);

        // 3. Preparar el objeto para la actualización.
        const antecedente: AlumnoAntecedenteFamiliar = {
            ...value,
            actualizado_por: metaData.actualizado_por
        };
        
        // 4. Actualizar en la base de datos.
        const { data, error } = await client.from("alumnos_ant_familiares").update(antecedente).match({ alumno_ent_familiar_id: id });
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async eliminar(client: SupabaseClient, id: number) {
        const { error } = await client.from("alumnos_ant_familiares").delete().match({ alumno_ent_familiar_id: id });
        if (error) {
            throw new Error(error.message);
        }
        return { message: "Antecedente familiar eliminado correctamente" };
    },

      async verificarAlumno(client: SupabaseClient, alumno_id: number) {
        const { error } = await client
            .from("alumnos")
            .select("alumno_id")
            .eq("alumno_id", alumno_id)
            .single();
        if (error) {
            throw new Error("El alumno no existe");
        }
    }
};