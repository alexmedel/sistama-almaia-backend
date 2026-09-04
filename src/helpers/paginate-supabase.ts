import Joi from "joi";

// ===== INTERFACES =====

export interface PaginationResult<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  
}

export interface PaginationResultWithInfo<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSize: number;
  expectedElements: string;
}

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  skip: number;
  take: number;
}

// ===== SCHEMAS DE VALIDACIÓN =====

export const paginaterShema = Joi.object({
  page: Joi.number().integer().min(1).required(),
  perPage: Joi.number().integer().min(1).max(100).required(), // Límite máximo por seguridad
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  perPage: Joi.number().integer().min(1).max(100).default(10),
});

// ===== FUNCIONES PARA ARRAYS COMPLETOS (tu función original) =====

/**
 * Pagina un array completo de items (para cuando tienes todos los datos en memoria)
 *
 * @param {T[]} items - El array completo de items a paginar
 * @param {number} page - El número de página actual (1-based)
 * @param {number} perPage - El número de items por página
 * @returns {PaginationResult<T>} Objeto con los datos paginados e info de paginación
 */
export function paginate<T>(
  items: T[],
  page: number,
  perPage: number
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  // Calcular el índice de inicio y fin para la porción de datos
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  // Extraer los elementos de la página actual
  const paginatedData = items.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalItems,
    totalPages,
    currentPage,
  };
}

/**
 * Versión extendida de paginate con más información
 */
export function paginateWithInfo<T>(
  items: T[],
  page: number,
  perPage: number
): PaginationResultWithInfo<T> {
  const result = paginate(items, page, perPage);
  
  // Calcular el rango de elementos que se están mostrando
  const startIndex = (result.currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, result.totalItems);

  return {
    ...result,
    hasNextPage: result.currentPage < result.totalPages,
    hasPreviousPage: result.currentPage > 1,
    pageSize: perPage,
    expectedElements: `${startIndex + 1}-${endIndex}`, // ✅ Propiedad agregada
  };
}

// ===== FUNCIONES PARA SUPABASE (cuando los datos ya están paginados) =====

/**
 * Convierte skip/take de Supabase a número de página
 */
export const getPageFromSkipTake = (skip: number, take: number): number => {
  return Math.floor(skip / take) + 1;
};

/**
 * Convierte página/perPage a skip/take para Supabase
 */
export const optionPaginationSupabase = (
  page: any,
  perPage: any
): PaginationOptions => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const perPageNumber = Math.max(1, Math.min(100, Number(perPage) || 10)); // Límite máximo
  const skip = (pageNumber - 1) * perPageNumber;
  const take = perPageNumber;
  return { skip, take };
};

/**
 * Crea un resultado de paginación cuando los datos ya vienen paginados de Supabase
 *
 * @param {T[]} data - Los datos ya paginados que vienen de Supabase
 * @param {number} totalItems - El count total de Supabase
 * @param {number} skip - El skip usado en la query
 * @param {number} take - El take usado en la query
 * @returns {PaginationResultWithInfo<T>} Resultado completo de paginación
 */
export function createPaginationFromSupabase<T>(
  data: T[],
  totalItems: number,
  skip: number,
  take: number
): PaginationResultWithInfo<T> {
  const currentPage = getPageFromSkipTake(skip, take);
  const totalPages = Math.ceil(totalItems / take);

  console.log("- currentPage calculada:", currentPage);
  console.log("- totalPages:", totalPages);

  return {
    data,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    pageSize: take,
    expectedElements: `${skip + 1}-${Math.min(skip + take, totalItems)}`,
  };
}

/**
 * Crea solo la información de paginación (sin datos)
 */
export function createPaginationInfo(
  totalItems: number,
  skip: number,
  take: number
): PaginationInfo {
  const currentPage = getPageFromSkipTake(skip, take);
  const totalPages = Math.ceil(totalItems / take);

  return {
    currentPage,
    totalPages,
    pageSize: take,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    skip,
    take,
  };
}

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Valida parámetros de paginación
 */
export const validatePagination = (page: any, perPage: any) => {
  const { error, value } = paginationQuerySchema.validate({ page, perPage });
  if (error) {
    throw new Error(`Parámetros de paginación inválidos: ${error.message}`);
  }
  return value;
};

/**
 * Calcula el rango de registros que se están mostrando
 */
export const getRecordRange = (
  skip: number,
  take: number,
  actualCount: number
) => {
  const start = skip + 1;
  const end = skip + actualCount;
  return { start, end };
};

/**
 * Genera metadata útil para APIs
 */
export const createPaginationMetadata = (
  totalItems: number,
  skip: number,
  take: number,
  actualCount: number
) => {
  const paginationInfo = createPaginationInfo(totalItems, skip, take);
  const recordRange = getRecordRange(skip, take, actualCount);

  return {
    ...paginationInfo,
    recordRange,
    showing: actualCount,
    total: totalItems,
    expectedElements: `${skip + 1}-${Math.min(skip + take, totalItems)}`,
  };
};

// ===== CONSTANTES =====

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 10;
export const MAX_PER_PAGE = 100;
