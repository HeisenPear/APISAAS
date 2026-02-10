/** Metadata de pagination */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Reponse API pour un element unique */
export interface ApiResponse<T> {
  data: T;
}

/** Reponse API pour une liste paginee */
export interface ApiListResponse<T> {
  data: T[];
  pagination: Pagination;
}

/** Structure d'erreur API */
export interface ApiError {
  statusCode: number;
  message: string;
}
