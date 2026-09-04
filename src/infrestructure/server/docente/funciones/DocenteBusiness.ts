// src/core/services/DocenteBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { DataService } from "../../DataService";
import { Docente } from "../../../../core/modelo/colegio/Docente";
import { DocenteSchema } from "../shema/DocenteSchema";
 

const dataService: DataService<Docente> = new DataService(
  "docentes",
  "docente_id"
);

export const DocenteBusiness = {
    /**
     * Obtiene docentes con sus relaciones.
     * @param where Filtros de la consulta.
     * @returns Una lista de docentes mapeados.
     */
    async obtener(where: any) {
        const docenteData = await dataService.getAll(
            [
                "*",
                "personas(*,persona_id,nombres,apellidos,usuarios(usuario_id,url_foto_perfil))",
                "colegios(colegio_id,nombre)"
            ],
            where
        );
        return docenteData.map((doc: any) => {
            const { personas, colegios, ...rest } = doc;
            const { usuarios, ...persona } = personas;
            return {  
                ...rest,
                url_foto_perfil: usuarios?.[0]?.url_foto_perfil || '/assets/img/avatar-docente.png',
                personas: { ...persona },
                colegios
            };
        });
    },

    /**
     * Obtiene el detalle de un docente por su ID.
     * @param id El ID del docente.
     * @returns Los detalles del docente.
     */
    async detalle(id: number) {
        const docenteData = await dataService.getAll(
            [
                "*",
                "personas(*,persona_id,estados_civiles(estado_civil_id,nombre),generos(genero_id,nombre),usuarios(usuario_id,url_foto_perfil))",
                "colegios(colegio_id,nombre)",
            ],
            { docente_id: id }
        );
        if (!docenteData || docenteData.length === 0) {
            throw new Error("Docente no encontrado.");
        }
        const { personas, colegios, ...rest } = docenteData[0] as any;
        const { usuarios, ...persona } = personas;
        return {
            ...rest,
            url_foto_perfil: usuarios?.[0]?.url_foto_perfil || '/assets/img/avatar-docente.png',
            personas: { ...persona },
            colegios
        };
    },

    /**
     * Guarda un nuevo docente.
     * @param client Cliente de Supabase.
     * @param body Datos del docente.
     * @param metaData Metadatos de creación.
     * @returns El docente guardado.
     */
    async guardar(client: SupabaseClient, body: any, metaData: { creado_por: number; actualizado_por: number }) {
        // 1. Validar los datos de entrada primero.
        const { error: validationError } = DocenteSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }

        // 2. Verificar la existencia de las dependencias.
        await this._verificarExistencia(client, body.persona_id, body.colegio_id);

        const docente: Docente = {
            ...body,
            creado_por: metaData.creado_por,
            actualizado_por: metaData.actualizado_por,
        };

        return await dataService.processData(docente);
    },

    /**
     * Actualiza un docente.
     * @param client Cliente de Supabase.
     * @param id El ID del docente a actualizar.
     * @param body Datos de actualización.
     * @param metaData Metadatos de actualización.
     * @returns Un mensaje de confirmación.
     */
    async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
        // 1. Validar los datos de entrada primero.
        const { error: validationError } = DocenteSchema.validate(body);
        if (validationError) {
            throw new Error(validationError.details[0].message);
        }

        // 2. Verificar la existencia de las dependencias.
        await this._verificarExistencia(client, body.persona_id, body.colegio_id);

        const docente  = {
            ...body,
            actualizado_por: metaData.actualizado_por,
        };
        
        await dataService.updateById(id, docente);
        return { message: "Docente actualizado correctamente" };
    },

    /**
     * Elimina un docente por su ID.
     * @param id El ID del docente a eliminar.
     * @returns Un mensaje de confirmación.
     */
    async eliminar(id: number) {
        await dataService.deleteById(id);
        return { message: "Docente eliminado correctamente" };
    },

    // Función auxiliar para verificar la existencia de persona y colegio
      async _verificarExistencia(client: SupabaseClient, personaId: number, colegioId: number) {
        const { data: personaData, error: personaError } = await client
            .from("personas")
            .select("persona_id")
            .eq("persona_id", personaId)
            .single();
        if (personaError || !personaData) {
            throw new Error("La persona no existe.");
        }
        
        const { data: colegioData, error: colegioError } = await client
            .from("colegios")
            .select("colegio_id")
            .eq("colegio_id", colegioId)
            .single();
        if (colegioError || !colegioData) {
            throw new Error("El colegio no existe.");
        }
    }
};