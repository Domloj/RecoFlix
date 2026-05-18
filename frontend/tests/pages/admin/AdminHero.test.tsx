import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { AdminHero } from '../../../src/pages/admin/components/AdminHero';

const renderWithProviders = () =>
  render(
    <MantineProvider>
      <AdminHero
        title="Zarządzanie użytkownikami RecoFlix"
        description="Panel do zarządzania kontami i rolami."
      />
    </MantineProvider>,
  );

describe('AdminHero', () => {
  it('renders hero title, description and badge', () => {
    // Arrange
    renderWithProviders();

    // Act
    const heading = screen.getByRole('heading', { name: /zarządzanie użytkownikami recoflix/i });

    // Assert
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/panel do zarządzania kontami i rolami/i)).toBeInTheDocument();
    expect(screen.getByText(/panel administracyjny/i)).toBeInTheDocument();
  });
});