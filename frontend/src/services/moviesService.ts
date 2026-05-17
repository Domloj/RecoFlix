import { fetchWithAuth } from './apiService';
import type { MoviesPageResponse } from '../interfaces/movies';

export interface MoviesQueryParams {
  page: number;
  pageSize: number;
  query?: string;
}

export const fetchMoviesPage = async ({ page, pageSize, query }: MoviesQueryParams): Promise<MoviesPageResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (query) {
    params.set('query', query);
  }

  return fetchWithAuth(`/movies/?${params.toString()}`);
};
