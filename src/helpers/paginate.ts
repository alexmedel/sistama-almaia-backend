import * as Joi from "joi";

export interface PaginationResult<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Paginates an array of items.
 *
 * @param {T[]} items - The array of items to paginate.
 * @param {number} page - The current page number (1-based).
 * @param {number} perPage - The number of items per page.
 * @returns {PaginationResult<T>} An object with the paginated data and pagination info.
 */
export function paginate<T>(
  items: T[],
  page: number,
  perPage: number
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));

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

export const paginaterShema = Joi.object({
  page: Joi.number().integer().required(),
  perPage: Joi.number().integer().required(),
});

export interface PaginationOptions {
  skip: number;
  take: number;
}

export const optionPaginationSupabase = (
  page: any,
  perPage: any
) => {
  const pageNumber = Number(page) || 1;
  const perPageNumber = Number(perPage) || 10;
  const skip = (pageNumber - 1) * perPageNumber;
  const take = perPageNumber;

  return { skip, take };
};
