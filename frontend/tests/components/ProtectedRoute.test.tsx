import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/context/AuthContext';

// mocks
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
}));

// test
describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ProtectedContent = <div data-testid="protected-content">Tajne dane konta</div>;

  it('przekierowuje na /login, gdy użytkownik NIE JEST zalogowany', () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(
      <ProtectedRoute>
        {ProtectedContent}
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renderuje przekazane dzieci, gdy użytkownik JEST zalogowany', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', role: 'user' } });

    render(
      <ProtectedRoute>
        {ProtectedContent}
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-mock')).not.toBeInTheDocument();
  });

  it('przekierowuje na /profile, gdy użytkownik nie ma wymaganej roli', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', role: 'user' } });

    render(
      <ProtectedRoute allowedRoles={['admin']}>
        {ProtectedContent}
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/profile');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renderuje przekazane dzieci, gdy użytkownik posiada wymaganą rolę', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', role: 'admin' } });

    render(
      <ProtectedRoute allowedRoles={['admin', 'user']}>
        {ProtectedContent}
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-mock')).not.toBeInTheDocument();
  });
});