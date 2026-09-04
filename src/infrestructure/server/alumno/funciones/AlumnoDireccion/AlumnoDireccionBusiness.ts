// src/core/services/AlumnoDireccionBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
 
import { AlumnoDireccionSchema } from "../../shema/AlumnoDireccionSchema";
import { AlumnoDireccion } from "../../../../../core/modelo/alumno/AlumnoDireccion";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";

/**
 * Lógica de negocio para la gestión de direcciones de alumnos.
 */
export const AlumnoDireccionBusiness = {
    async obtener(client: SupabaseClient, query: any) {
        const { colegio_id, ...where } = query;
        if (colegio_id !== undefined) {
            return await obtenerRelacionados({
                tableFilter: "alumnos",
                filterField: "colegio_id",
                filterValue: colegio_id,
                idField: "alumno_id",
                tableIn: "alumnos_direcciones",
                inField: "alumno_id",
                selectFields: `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email), comunas(comuna_id,nombre,regiones(region_id,nombre))`,
            });
        }
        
        const { data, error } = await client
            .from("alumnos_direcciones")
            .select(`
                *,
                alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email),
                comunas(comuna_id,nombre,regiones(region_id,nombre))
            `)
            .match(where);
        
        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    async guardar(client: SupabaseClient, body: any, metaData: { creado_por: number; actualizado_por: number }) {
        // 1. Validar los datos de entrada primero.
        const { error: validationError, value } = AlumnoDireccionSchema.validate(body);
        if (validationError) {
            throw new Error(`Error de validación: ${validationError.details[0].message}`);
        }

        // 2. Verificar la existencia de las entidades relacionadas.
        await this.verificarRelaciones(client, value);

        // 3. Preparar el objeto para la inserción.
        const alumnoDireccion: AlumnoDireccion = {
            ...value,
            creado_por: metaData.creado_por,
            actualizado_por: metaData.actualizado_por
        };
        
        // 4. Insertar en la base de datos.
        const { data: savedData, error: saveError } = await client
            .from("alumnos_direcciones")
            .insert(alumnoDireccion)
            .single();

        if (saveError) {
            throw new Error(saveError.message);
        }
        return savedData;
    },

    async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
        // 1. Validar los datos de entrada primero.
        const { error: validationError, value } = AlumnoDireccionSchema.validate(body);
        if (validationError) {
            throw new Error(`Error de validación: ${validationError.details[0].message}`);
        }

        // 2. Verificar la existencia de las entidades relacionadas.
        await this.verificarRelaciones(client, value);

        // 3. Preparar el objeto para la actualización.
        const alumnoDireccion: AlumnoDireccion = {
            ...value,
            actualizado_por: metaData.actualizado_por
        };

        // 4. Actualizar en la base de datos.
        const { data: updatedData, error: updateError } = await client
            .from("alumnos_direcciones")
            .update(alumnoDireccion)
            .match({ alumno_direccion_id: id });
        
        if (updateError) {
            throw new Error(updateError.message);
        }
        return updatedData;
    },

    async eliminar(client: SupabaseClient, id: number) {
        const { error } = await client
            .from("alumnos_direcciones")
            .delete()
            .match({ alumno_direccion_id: id });
        
        if (error) {
            throw new Error(error.message);
        }
        return { message: "Dirección del alumno eliminada correctamente" };
    },

      async verificarRelaciones(client: SupabaseClient, data: any) {
        // Función privada para verificar la existencia de entidades relacionadas.
        const { error: alumnoError } = await client.from("alumnos").select("alumno_id").eq("alumno_id", data.alumno_id).single();
        if (alumnoError) throw new Error("El alumno no existe.");

        const { error: paisError } = await client.from("paises").select("pais_id").eq("pais_id", data.pais_id).single();
        if (paisError) throw new Error("El país no existe.");

        const { error: regionError } = await client.from("regiones").select("region_id").eq("region_id", data.region_id).single();
        if (regionError) throw new Error("La región no existe.");

        const { error: comunaError } = await client.from("comunas").select("comuna_id").eq("comuna_id", data.comuna_id).single();
        if (comunaError) throw new Error("La comuna no existe.");
    }
};