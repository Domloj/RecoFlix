import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MoviesPage } from '../../../src/pages/movies/MoviesPage';
import { fetchMoviesPage } from '../../../src/services/moviesService';
import type { MovieListItem, MoviesPageResponse } from '../../../src/interfaces/movies';

vi.mock('../../../src/services/moviesService', () => ({
  fetchMoviesPage: vi.fn(),
}));

vi.mock('../../../src/config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  app: {},
}));

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

const renderWithProviders = () => {
  return render(
    <MantineProvider>
      <MoviesPage />
    </MantineProvider>
  );
};

const buildResponse = (items: MovieListItem[], total: number): MoviesPageResponse => ({
  items,
  total,
  page: 1,
  page_size: 50,
});

describe('MoviesPage', () => {
  const mockMovie: MovieListItem = {
    id: 1,
    title: 'Matrix',
    release_year: '1999',
    description: 'A hacker learns about the true nature of reality.',
    poster_url: 'https://example.com/matrix.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders movies and opens modal after selecting a card', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(fetchMoviesPage).mockResolvedValue(buildResponse([mockMovie], 1));

    // Act
    renderWithProviders();

    // Assert
    const cardButton = await screen.findByRole('button', { name: /matrix/i });
    expect(cardButton).toBeInTheDocument();

    await user.click(cardButton);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/matrix/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/true nature of reality/i)).toBeInTheDocument();
  });

  it('fetches movies with a search query after submitting', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(fetchMoviesPage).mockResolvedValue(buildResponse([mockMovie], 1));

    // Act
    renderWithProviders();
    await screen.findByText(/matrix/i);

    const searchInput = screen.getByPlaceholderText(/szukaj po tytule filmu/i);
    await user.type(searchInput, 'matrix');
    await user.click(screen.getByRole('button', { name: /szukaj/i }));

    // Assert
    await waitFor(() => {
      expect(fetchMoviesPage).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 50,
        query: 'matrix',
      });
    });
  });

  it('renders an error message when the request fails', async () => {
    // Arrange
    vi.mocked(fetchMoviesPage).mockRejectedValue(new Error('Network error'));

    // Act
    renderWithProviders();

    // Assert
    expect(await screen.findByText(/nie uda/i)).toBeInTheDocument();
  });

  it('shows empty state when no movies are returned', async () => {
    // Arrange
    vi.mocked(fetchMoviesPage).mockResolvedValue(buildResponse([], 0));

    // Act
    renderWithProviders();

    // Assert
    expect(await screen.findByText(/nie znaleziono/i)).toBeInTheDocument();
  });

  it('requests a different page after pagination click', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(fetchMoviesPage).mockResolvedValue(buildResponse([mockMovie], 120));

    // Act
    renderWithProviders();
    await screen.findByText(/matrix/i);
    await user.click(await screen.findByRole('button', { name: '2' }));

    // Assert
    await waitFor(() => {
      expect(fetchMoviesPage).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 50,
        query: undefined,
      });
    });
  });
});