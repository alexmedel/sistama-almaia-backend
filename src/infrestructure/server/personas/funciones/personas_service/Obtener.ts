// Importaciones necesarias
import { SupabaseClient } from "@supabase/supabase-js";
import { DataService } from "../../../DataService";
import { Persona } from "../../../../../core/modelo/Persona";

// Asume que dataService es un servicio genérico para interactuar con tu BD

// Función para obtener personas filtradas por colegio y rol
export const obtenerPersonasPorColegioYRol = async (
  colegioId: number,
  rolId: number,
  client: SupabaseClient
) => {
  const { data: dataPersonaRol, error } = await client.rpc(
    "personas_por_colegio_rol",
    {
      p_colegio_id: colegioId,
      p_rol_id: rolId,
    }
  );

  if (error) {
    throw new Error(
      `Error al obtener personas por colegio y rol: ${error.message}`
    );
  }

  // Procesa el resultado para extraer la información relevante
  return dataPersonaRol.map((item: { persona_json: any }) => item.persona_json);
};

// Función para obtener todas las personas con filtros genéricos
export const obtenerTodasLasPersonas = async (
  filtros: object,
  dataService: DataService<Persona>
) => {
  return await dataService.getAll(
    [
      "*",
      "generos(genero_id,nombre)",
      "estados_civiles(estado_civil_id,nombre)",
    ],
    filtros
  );
};
