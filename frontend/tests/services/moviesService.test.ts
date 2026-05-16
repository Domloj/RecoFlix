import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchMoviesPage } from '../../src/services/moviesService';
import { fetchWithAuth } from '../../src/services/apiService';
import type { MoviesPageResponse } from '../../src/interfaces/movies';

vi.mock('../../src/services/apiService', () => ({
  fetchWithAuth: vi.fn(),
}));

describe('moviesService - fetchMoviesPage', () => {
  const mockResponse: MoviesPageResponse = {
    items: [],
    page: 1,
    page_size: 50,
    total: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchWithAuth with paging parameters', async () => {
    // Arrange
    vi.mocked(fetchWithAuth).mockResolvedValue(mockResponse);

    // Act
    await fetchMoviesPage({ page: 1, pageSize: 50 });

    // Assert
    expect(fetchWithAuth).toHaveBeenCalledWith('/movies/?page=1&page_size=50');
  });

  it('adds a query parameter when provided', async () => {
    // Arrange
    vi.mocked(fetchWithAuth).mockResolvedValue(mockResponse);

    // Act
    await fetchMoviesPage({ page: 2, pageSize: 25, query: 'star' });

    // Assert
    expect(fetchWithAuth).toHaveBeenCalledWith('/movies/?page=2&page_size=25&query=star');
  });
});