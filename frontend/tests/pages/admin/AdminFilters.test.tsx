import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';

import { AdminFilters } from '../../../src/pages/admin/components/AdminFilters';

const renderWithProviders = () => {
  const handleSearchChange = vi.fn();
  const handleRoleFilterChange = vi.fn();
  const handleRefresh = vi.fn();

  render(
    <MantineProvider>
      <AdminFilters
        search=""
        roleFilter="all"
        onSearchChange={handleSearchChange}
        onRoleFilterChange={handleRoleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={false}
      />
    </MantineProvider>,
  );

  return { handleSearchChange, handleRoleFilterChange, handleRefresh };
};

describe('AdminFilters', () => {
  it('renders search, role filter and refresh button', () => {
    // Arrange
    renderWithProviders();

    // Act & Assert
    expect(screen.getByPlaceholderText(/szukaj po nazwie, mailu albo uid/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filtr roli/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /odśwież/i })).toBeInTheDocument();
  });

  it('calls search and refresh handlers on user interaction', async () => {
    // Arrange
    const user = userEvent.setup();
    const { handleSearchChange, handleRefresh } = renderWithProviders();

    // Act
    await user.type(screen.getByPlaceholderText(/szukaj po nazwie, mailu albo uid/i), 'anna');
    await user.click(screen.getByRole('button', { name: /odśwież/i }));

    // Assert
    expect(handleSearchChange).toHaveBeenCalled();
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });
});