import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { AdminNotice } from '../../../src/pages/admin/components/AdminNotice';

const renderWithProviders = () =>
  render(
    <MantineProvider>
      <AdminNotice
        title="Jak nadać rolę admina"
        message="Nadaj custom claim admin: true przez Firebase Admin SDK."
      />
    </MantineProvider>,
  );

describe('AdminNotice', () => {
  it('renders notice title and message', () => {
    // Arrange
    renderWithProviders();

    // Act & Assert
    expect(screen.getByRole('heading', { name: /jak nadać rolę admina/i })).toBeInTheDocument();
    expect(screen.getByText(/nadaj custom claim admin: true/i)).toBeInTheDocument();
  });
});