import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { AdminStatsGrid } from '../../../src/pages/admin/components/AdminStatsGrid';

const renderWithProviders = () =>
  render(
    <MantineProvider>
      <AdminStatsGrid totalUsers={14} adminUsers={2} regularUsers={12} recentUsers={3} />
    </MantineProvider>,
  );

describe('AdminStatsGrid', () => {
  it('renders all stats cards with provided values', () => {
    // Arrange
    renderWithProviders();

    // Act & Assert
    expect(screen.getByText('Łącznie kont')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('Administratorzy')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Zwykli użytkownicy')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Nowe konta 7 dni')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});