 
import { SupabaseClient } from "@supabase/supabase-js";
import { GenericFilterOptions } from "../modelo/GenericFilterOptions";
import { SupabaseClientService } from "./supabaseClient";
import { PaginationOptions } from "../../helpers/paginate";
const supabaseService = new SupabaseClientService();
const client: SupabaseClient = supabaseService.getClient();
export async function obtenerRelacionados({
  tableFilter,
  filterField,
  filterValue,
  idField,
  tableIn,
  inField,
  selectFields,
  orderBy, // Nuevo parámetro opcional
}: GenericFilterOptions & { orderBy?: { field: string; ascending: boolean } }) {
  // 1) Obtener los registros filtrados para sacar los IDs
  const { data: registrosFiltrados, error: errorFiltrado } = await client
    .from(tableFilter)
    .select("*")
    .order("fecha_creacion", { ascending: false })
    .eq(filterField, filterValue)
    

  if (errorFiltrado) {
    throw new Error(
      `Error consultando ${tableFilter}: ${errorFiltrado.message}`
    );
  }

  const ids = registrosFiltrados?.map((r: any) => r[idField]) ?? [];

  if (ids.length === 0) {
    // No hay registros que coincidan
    return [];
  }

  // 2) Consulta con `.in()` usando esos IDs y selectFields con ordenamiento opcional
  let query = client
    .from(tableIn)
    .select(Array.isArray(selectFields) ? selectFields.join(",") : selectFields)
   
    .in(inField, ids);

  // Solo aplicar ordenamiento si se proporciona el parámetro

  if (orderBy) {
    query = query.order(orderBy.field, { ascending: orderBy.ascending });
  }

  const { data: datosRelacionados, error: errorRelacionados } = await query;

  if (errorRelacionados) {
    throw new Error(
      `Error consultando ${tableIn}: ${errorRelacionados.message}`
    );
  }

  return datosRelacionados;
}

// 🔹 Helper: calcula rango UTC de una fecha
function getFechaRange(fechaStr: string) {
  const buildRange = (y: number, m: number, d: number) => ({
    inicio: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)).toISOString(),
    fin: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)).toISOString(),
  });

  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [y, m, d] = fechaStr.split("-").map(Number);
    return buildRange(y, m - 1, d);
  }

  const date = new Date(fechaStr);
  return buildRange(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

// 🔹 Helper: aplica filtros dinámicos
function applyWhere(query: any, where: Record<string, any>) {
  const opMap: Record<string, string> = {
    ">=": "gte",
    "<=": "lte",
    "!=": "neq",
    ">": "gt",
    "<": "lt",
    "=": "eq",
  };

  for (const [campo, valor] of Object.entries(where)) {
    if (valor === undefined || valor === null || valor === "Todos") continue;

    if (Array.isArray(valor)) {
      query = query.in(campo, valor);
    } else if (valor === "true" || valor === "false") {
      query = query.eq(campo, valor === "true");
    } else if (!isNaN(Number(valor)) && String(valor).trim() !== "") {
      query = query.eq(campo, Number(valor));
    } else {
      const operadores = [">=", "<=", "!=", ">", "<", "="];
      const operador = operadores.find((op) => String(valor).startsWith(op));

      if (operador) {
        const val = String(valor).slice(operador.length);
        query = query.filter(campo, opMap[operador] ?? operador, val);
      } else {
        query = query.eq(campo, valor);
      }
    }
  }

  return query;
}

// 🔹 Helper: obtiene IDs de tableFilter
async function obtenerIds(
  table: string,
  idField: string,
  filterField?: string,
  filterValue?: any
) {
  let query = client
    .from(table)
    .select(idField)
  
    .order("fecha_creacion", { ascending: false });
  if (
    filterField &&
    filterValue !== undefined &&
    filterValue !== null &&
    filterValue !== "undefined" &&
    filterValue !== ""
  ) {
    query = query.eq(filterField, filterValue);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error consultando ${table}: ${error.message}`);
  return data?.map((r: any) => r[idField]) ?? [];
}

// 🔹 Función principal
export async function obtenerRelacionadosPaginate({
  tableFilter,
  filterField,
  filterValue,
  idField,
  tableIn,
  inField,
  selectFields,
  skip,
  take,
  where = {},
  fecha,
}: GenericFilterOptions & PaginationOptions) {
  try {
   
    const ids = await obtenerIds(
      tableFilter,
      idField,
      filterField,
      filterValue
    );
    if (ids.length === 0) {
      return {
        data: [],
        totalItems: 0,
        pagination: {
          currentPage: 1,
          totalPages: 0,
          pageSize: take,
          hasNextPage: false,
          hasPreviousPage: false,
          skip,
          take,
        },
      };
    }

    // 2) Base de queries
    const fechaRange =
      fecha && fecha !== "no" ? getFechaRange(String(fecha).trim()) : null;

    let countQuery = client
      .from(tableIn)
      .select("*", { count: "exact", head: true })
      .eq("activo", true)
      .in(inField, ids);
    let dataQuery = client
      .from(tableIn)
      .select(selectFields)
       .eq("activo", true)
      .in(inField, ids);

    // 3) Filtro por fecha
    if (fechaRange) {
      countQuery = countQuery
        .gte("fecha_creacion", fechaRange.inicio)
        .lte("fecha_creacion", fechaRange.fin);
      dataQuery = dataQuery
        .gte("fecha_creacion", fechaRange.inicio)
        .lte("fecha_creacion", fechaRange.fin);
    }

    // 4) Filtros dinámicos
    countQuery = applyWhere(countQuery, where);
    dataQuery = applyWhere(dataQuery, where);

    // 5) Orden + paginación
    countQuery = countQuery.order("fecha_creacion", { ascending: false });
    dataQuery = dataQuery
      .order("fecha_creacion", { ascending: false })
      .range(skip, skip + take - 1);

    // 6) Ejecutar queries
    const [{ count, error: countError }, { data, error: dataError }] =
      await Promise.all([countQuery, dataQuery]);
    if (countError) throw new Error(`Error en count: ${countError.message}`);
    if (dataError) throw new Error(`Error en data: ${dataError.message}`);

    // 7) Armar respuesta
    const currentPage = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil((count || 0) / take);
    console.log('data');
    console.log(data);
    return {
      data: data ?? [],
      totalItems: (count ?? 0)   ,
      pagination: {
        currentPage,
        totalPages,
        pageSize: take,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        skip,
        take,
      },
    };
  } catch (e) {
    console.error("Error:", e);
    throw new Error(
      `Error consultando ${tableIn}: ${
        e instanceof Error ? e.message : "Error desconocido"
      }`
    );
  }
}


