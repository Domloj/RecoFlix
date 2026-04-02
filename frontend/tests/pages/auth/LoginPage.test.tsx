import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../../../src/pages/auth/LoginPage';
import '@testing-library/jest-dom/vitest';
import { signInWithEmailAndPassword } from 'firebase/auth';

// mocks
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

vi.mock('../../../src/config/firebase', () => ({
  auth: {}, 
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </MantineProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks(); 
  });

  it('wyświetla błędy walidacji dla niepoprawnych danych', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'niepoprawny-email');
    await user.type(screen.getByLabelText(/Hasło/i), '123');
    await user.click(screen.getByRole('button', { name: /Zaloguj się/i }));

    expect(await screen.findByText('Niepoprawny format email')).toBeInTheDocument();
    expect(await screen.findByText('Hasło musi mieć co najmniej 6 znaków')).toBeInTheDocument();
    
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('wywołuje Firebase i przekierowuje po udanym logowaniu', async () => {
    const user = userEvent.setup();
    (signInWithEmailAndPassword as any).mockResolvedValueOnce({ user: { email: 'test@test.com' } });

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Hasło/i), 'dobrehaslo123');
    await user.click(screen.getByRole('button', { name: /Zaloguj się/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('wyświetla błąd logowania z Firebase', async () => {
    const user = userEvent.setup();
    (signInWithEmailAndPassword as any).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Hasło/i), 'złehasło123');
    await user.click(screen.getByRole('button', { name: /Zaloguj się/i }));

    expect(await screen.findByText('Nieprawidłowy email lub hasło.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});