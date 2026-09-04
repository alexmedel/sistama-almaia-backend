// paginationService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { optionPaginationSupabase, paginaterShema } from "./paginate";
import { createPaginationFromSupabase } from "./paginate-supabase";
import { SupabaseClientService } from "../core/services/supabaseClient";
// ===== INTERFACES =====
const supabaseService = new SupabaseClientService();

const client: SupabaseClient = supabaseService.getClient();
interface BaseFilter {
  [key: string]: any;
}

interface SearchConfig {
  fields: string[]; // Campos donde buscar
  foreignTable?: string; // Tabla foránea si es necesario
}

interface OrderConfig {
  field: string;
  ascending?: boolean;
}

interface PaginatedQueryConfig {
  tableName: string;
  selectFields: string;
  baseFilters?: BaseFilter; // Filtros fijos como colegio_id, activo: true
  searchConfig?: SearchConfig; // Configuración de búsqueda
  orderBy?: OrderConfig; // Ordenamiento
  customFilters?: (query: any) => any; // Función para filtros personalizados
}

interface PaginatedQueryParams {
  page: any;
  perPage: any;
  search?: string; // Término de búsqueda
  [key: string]: any; // Otros parámetros de filtros
}

// ===== SERVICIO PRINCIPAL =====

export class PaginationService {
  /**
   * Función principal que maneja toda la lógica de paginación
   */
  static async getPaginatedData<T>(
    config: PaginatedQueryConfig,
    params: PaginatedQueryParams
  ): Promise< any> {
    console.log("=== PAGINATION SERVICE ===");
    console.log("Config:", { tableName: config.tableName, params });

    // 1. Validar paginación
    const validation = paginaterShema.validate({
      page: params.page,
      perPage: params.perPage,
    });

    if (validation.error) {
      throw new Error(
        `Parámetros de paginación inválidos: ${validation.error.message}`
      );
    }

    const { skip, take } = optionPaginationSupabase(
      params.page,
      params.perPage
    );
    console.log(`Paginación: skip=${skip}, take=${take}`);

    // 2. Construir query base para count
    let countQuery = client
      .from(config.tableName)
      .select("*", { count: "exact", head: true });

    // 3. Aplicar filtros base para count
    if (config.baseFilters) {
      countQuery = this.applyFilters(countQuery, config.baseFilters);
    }

    // 4. Aplicar búsqueda para count
    if (params.search && config.searchConfig) {
      countQuery = this.applySearch(
        countQuery,
        params.search,
        config.searchConfig
      );
    }

    // 5. Aplicar filtros personalizados para count
    if (config.customFilters) {
      countQuery = config.customFilters(countQuery);
    }

    // 6. Obtener count
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error en count:", countError);
      throw new Error(`Error obteniendo count: ${countError.message}`);
    }

    console.log("Total registros:", count);

    if (!count || count === 0) {
      return createPaginationFromSupabase([], 0, skip, take);
    }

    // 7. Construir query para datos
    let dataQuery = client.from(config.tableName).select(config.selectFields);

    // 8. Aplicar los mismos filtros para datos
    if (config.baseFilters) {
      dataQuery = this.applyFilters(dataQuery, config.baseFilters);
    }

    if (params.search && config.searchConfig) {
      dataQuery = this.applySearch(
        dataQuery,
        params.search,
        config.searchConfig
      );
    }

    if (config.customFilters) {
      dataQuery = config.customFilters(dataQuery);
    }

    // 9. Aplicar ordenamiento
    if (config.orderBy) {
      dataQuery = dataQuery.order(config.orderBy.field, {
        ascending: config.orderBy.ascending ?? false,
      });
    }

    // 10. Aplicar paginación
    dataQuery = dataQuery.range(skip, skip + take - 1);

    // 11. Ejecutar query de datos
    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      console.error("Error en datos:", dataError);
      throw new Error(
        `Error consultando ${config.tableName}: ${dataError.message}`
      );
    }

    console.log(`✅ Datos obtenidos: ${data?.length || 0} registros`);

    // 12. Crear resultado final
    return createPaginationFromSupabase(data || [], count, skip, take);
  }

  /**
   * Aplica filtros básicos a una query
   */
  private static applyFilters(query: any, filters: BaseFilter): any {
    for (const [field, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        query = query.in(field, value);
      } else if (typeof value === "boolean") {
        query = query.eq(field, value);
      } else if (typeof value === "string" && value.startsWith("!")) {
        query = query.neq(field, value.substring(1));
      } else {
        query = query.eq(field, value);
      }
    }
    return query;
  }

  /**
   * Aplica búsqueda de texto
   */
  private static applySearch(
    query: any,
    searchTerm: string,
    config: SearchConfig
  ): any {
    if (!searchTerm || searchTerm.trim() === "") return query;

    const cleanSearch = searchTerm.trim();
    console.log(
      `Aplicando búsqueda: "${cleanSearch}" en campos:`,
      config.fields
    );

    // Construir condiciones OR para cada campo
    const conditions = config.fields.map(
      (field) => `${field}.ilike.%${cleanSearch}%`
    );
    const orCondition = conditions.join(",");

    if (config.foreignTable) {
      return query.or(orCondition, { foreignTable: config.foreignTable });
    } else {
      return query.or(orCondition);
    }
  }
}

// ===== FUNCIONES DE CONVENIENCIA =====

/**
 * Función simplificada para casos comunes
 */
export async function getSimplePaginatedData<T>(
  tableName: string,
  selectFields: string,
  baseFilters: BaseFilter,
  params: PaginatedQueryParams,
  orderBy?: OrderConfig
) {
  return PaginationService.getPaginatedData<T>(
    {
      tableName,
      selectFields,
      baseFilters,
      orderBy,
    },
    params
  );
}

/**
 * Función para tablas con búsqueda
 */
export async function getPaginatedDataWithSearch<T>(
  tableName: string,
  selectFields: string,
  baseFilters: BaseFilter,
  searchConfig: SearchConfig,
  params: PaginatedQueryParams,
  orderBy?: OrderConfig
) {
  return PaginationService.getPaginatedData<T>(
    {
      tableName,
      selectFields,
      baseFilters,
      searchConfig,
      orderBy,
    },
    params
  );
}
