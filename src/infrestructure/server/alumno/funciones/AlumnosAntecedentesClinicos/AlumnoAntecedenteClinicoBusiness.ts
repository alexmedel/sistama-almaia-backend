// src/core/services/AlumnoAntecedenteClinicoBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
 import Joi from "joi";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoAntecedenteClinico } from "../../../../../core/modelo/alumno/AlumnoAntecedenteClinico";


const AlumnoAntecedenteClinicoSchema = Joi.object({
    alumno_id: Joi.number().integer().required(),
    historial_medico: Joi.string().max(30).optional(),
    alergias: Joi.string().max(50).optional(),
    enfermedades_cronicas: Joi.string().max(50).optional(),
    condiciones_medicas_relevantes: Joi.string().max(50).optional(),
    medicamentos_actuales: Joi.string().max(50).optional(),
    diagnosticos_previos: Joi.string().max(50).optional(),
    terapias_tratamiento_curso: Joi.string().max(50).optional(),
});

/**
 * Lógica de negocio para la gestión de antecedentes clínicos de alumnos.
 */
export const AlumnoAntecedenteClinicoBusiness = {
    async obtener(client: SupabaseClient, query: any) {
        const { colegio_id, ...where } = query;
        if (colegio_id !== undefined) {
            return await obtenerRelacionados({
                tableFilter: "alumnos",
                filterField: "colegio_id",
                filterValue: colegio_id,
                idField: "alumno_id",
                tableIn: "alumnos_ant_clinicos",
                inField: "alumno_id",
                selectFields: `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))`,
            });
        }
        
        const { data, error } = await client
            .from("alumnos_ant_clinicos")
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
        const { error: validationError, value } = AlumnoAntecedenteClinicoSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }

        // 2. Verificar que el alumno existe.
        await this.verificarAlumno(client, value.alumno_id);

        // 3. Preparar el objeto para la inserción.
        const antecedente: AlumnoAntecedenteClinico = {
            ...value,
            creado_por: metaData.creado_por,
            actualizado_por: metaData.actualizado_por,
            activo: true
        };

        // 4. Insertar en la base de datos.
        const { data, error } = await client.from("alumnos_ant_clinicos").insert(antecedente).single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
        // 1. Validar los datos de entrada al inicio.
        const { error: validationError, value } = AlumnoAntecedenteClinicoSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }
        
        // 2. Verificar que el alumno existe.
        await this.verificarAlumno(client, value.alumno_id);

        // 3. Preparar el objeto para la actualización.
        const antecedente: AlumnoAntecedenteClinico = {
            ...value,
            actualizado_por: metaData.actualizado_por
        };
        
        // 4. Actualizar en la base de datos.
        const { data, error } = await client.from("alumnos_ant_clinicos").update(antecedente).match({ alumno_ant_clinico_id: id });
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async eliminar(client: SupabaseClient, id: number) {
        const { error } = await client.from("alumnos_ant_clinicos").delete().match({ alumno_ant_clinico_id: id });
        if (error) {
            throw new Error(error.message);
        }
        return { message: "Antecedente clínico eliminado correctamente" };
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