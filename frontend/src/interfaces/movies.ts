export interface MovieListItem {
  id: number;
  title: string;
  release_year: string;
  description: string;
  poster_url: string;
}

export interface MoviesPageResponse {
  items: MovieListItem[];
  page: number;
  page_size: number;
  total: number;
}
