import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

import { MovieCard } from '../../../src/pages/movies/MovieCard';
import type { MovieListItem } from '../../../src/interfaces/movies';

const renderWithProviders = (ui: ReactNode) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

vi.mock('../../../src/config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  app: {},
}));

describe('MovieCard', () => {
  const mockMovie: MovieListItem = {
    id: 42,
    title: 'Inception',
    release_year: '2010',
    description: 'A thief steals corporate secrets through dream-sharing tech.',
    poster_url: 'https://example.com/inception.jpg',
  };

  it('renders movie details', () => {
    // Arrange
    renderWithProviders(<MovieCard movie={mockMovie} />);

    // Act
    const title = screen.getByText(/inception/i);
    const year = screen.getByText(/2010/i);
    const description = screen.getByText(/dream-sharing/i);

    // Assert
    expect(title).toBeInTheDocument();
    expect(year).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  it('invokes onClick when the card is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<MovieCard movie={mockMovie} onClick={onClick} />);

    // Act
    await user.click(screen.getByRole('button', { name: /inception/i }));

    // Assert
    expect(onClick).toHaveBeenCalledWith(mockMovie);
  });

  it('invokes onClick when activated via keyboard', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<MovieCard movie={mockMovie} onClick={onClick} />);
    const cardButton = screen.getByRole('button', { name: /inception/i });

    // Act
    cardButton.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    // Assert
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenCalledWith(mockMovie);
  });
});