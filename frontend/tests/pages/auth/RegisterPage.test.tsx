import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterPage } from '../../../src/pages/auth/RegisterPage';
import { registerUser } from '../../../src/services/authService';

// mocks
vi.mock('../../../src/services/authService', () => ({
  registerUser: vi.fn(),
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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wyświetla błędy walidacji dla niepoprawnych danych i nie wysyła formularza', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nazwa użytkownika/i), 'ab');
    await user.type(screen.getByLabelText(/Email/i), 'zly-email');
    await user.type(screen.getByLabelText(/Hasło/i), '12345');
    await user.click(screen.getByRole('button', { name: /Załóż konto/i }));

    expect(await screen.findByText('Nazwa musi mieć min. 3 znaki')).toBeInTheDocument();
    expect(await screen.findByText('Niepoprawny format email')).toBeInTheDocument();
    expect(await screen.findByText('Hasło musi mieć co najmniej 6 znaków')).toBeInTheDocument();
    
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('wywołuje registerUser i przekierowuje na profil przy sukcesie', async () => {
    const user = userEvent.setup();
    
    (registerUser as any).mockResolvedValueOnce(undefined);

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nazwa użytkownika/i), 'Kinomaniak');
    await user.type(screen.getByLabelText(/Email/i), 'nowy@test.com');
    await user.type(screen.getByLabelText(/Hasło/i), 'bezpieczneHaslo1');
    await user.click(screen.getByRole('button', { name: /Załóż konto/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledTimes(1);
      expect(registerUser).toHaveBeenCalledWith({
        username: 'Kinomaniak',
        email: 'nowy@test.com',
        password: 'bezpieczneHaslo1',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('wyświetla błąd, gdy registerUser rzuci wyjątek (np. zajęty email)', async () => {
    const user = userEvent.setup();
    
    (registerUser as any).mockRejectedValueOnce(new Error('Email already in use'));

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nazwa użytkownika/i), 'UserTest');
    await user.type(screen.getByLabelText(/Email/i), 'zajety@test.com');
    await user.type(screen.getByLabelText(/Hasło/i), 'dobreHaslo');
    await user.click(screen.getByRole('button', { name: /Załóż konto/i }));

    expect(
      await screen.findByText('Błąd rejestracji. Upewnij się, że email nie jest już zajęty.')
    ).toBeInTheDocument();
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});