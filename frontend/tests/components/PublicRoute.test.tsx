import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicRoute } from '../../src/components/PublicRoute';
import { useAuth } from '../../src/context/AuthContext';

// mocks
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
}));

// test
describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const PublicContent = <div data-testid="public-content">Formularz logowania/rejestracji</div>;

  it('renderuje przekazane dzieci, gdy użytkownik NIE JEST zalogowany', () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(
      <PublicRoute>
        {PublicContent}
      </PublicRoute>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-mock')).not.toBeInTheDocument();
  });

  it('przekierowuje na /profile, gdy użytkownik JEST zalogowany', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123' } });

    render(
      <PublicRoute>
        {PublicContent}
      </PublicRoute>
    );

    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/profile');
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });
});