// Define una interfaz para el tipo de datos que se va a devolver
interface PaginationResult<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

