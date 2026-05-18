import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { AdminUserRecord } from '../../../src/interfaces/admin';

const mockUseAuth = vi.fn();

vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../src/services/adminService', () => ({
  fetchAdminUsers: vi.fn(),
  updateAdminUser: vi.fn(),
  buildAdminStats: vi.fn((users: AdminUserRecord[]) => ({
    totalUsers: users.length,
    adminUsers: users.filter((user) => user.role === 'admin').length,
    regularUsers: users.filter((user) => user.role === 'user').length,
    recentUsers: users.length,
  })),
}));

import { AdminPage } from '../../../src/pages/admin/AdminPage';
import { fetchAdminUsers, updateAdminUser } from '../../../src/services/adminService';

const mockUsers: AdminUserRecord[] = [
  {
    uid: 'admin-1',
    username: 'Admin One',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: '2026-05-12T10:00:00.000Z',
  },
  {
    uid: 'user-2',
    username: 'Alice',
    email: 'alice@example.com',
    role: 'user',
    createdAt: '2026-05-10T10:00:00.000Z',
  },
];

const renderPage = () =>
  render(
    <MantineProvider>
      <AdminPage />
    </MantineProvider>,
  );

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-1', role: 'admin', username: 'Admin One', email: 'admin@example.com' },
    });
  });

  it('loads users and renders the admin dashboard', async () => {
    // Arrange
    vi.mocked(fetchAdminUsers).mockResolvedValue(mockUsers);

    // Act
    renderPage();

    // Assert
    expect(await screen.findByRole('heading', { name: /zarządzanie użytkownikami recoflix/i })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Admin One')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByText(/łącznie kont/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /odśwież/i })).toBeInTheDocument();
  });

  it('filters users by search input and saves edited user data', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(fetchAdminUsers).mockResolvedValue(mockUsers);
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);

    // Act
    renderPage();
    await screen.findByDisplayValue('Alice');

    const searchInput = screen.getByPlaceholderText(/szukaj po nazwie, mailu albo uid/i);
    await user.type(searchInput, 'alice');

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Admin One')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    });

    const aliceRow = screen.getByText('alice@example.com').closest('tr');
    expect(aliceRow).not.toBeNull();

    const usernameInput = screen.getByDisplayValue('Alice') as HTMLInputElement;
    await user.clear(usernameInput);
    await user.type(usernameInput, 'Alice Updated');

    const saveButton = within(aliceRow as HTMLTableRowElement).getByRole('button', { name: /zapisz/i });
    await user.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(updateAdminUser).toHaveBeenCalledWith('user-2', {
        username: 'Alice Updated',
        role: 'user',
      });
    });
  });

  it('shows an error message when fetching users fails', async () => {
    // Arrange
    vi.mocked(fetchAdminUsers).mockRejectedValue(new Error('Network error'));

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText(/nie udało się pobrać użytkowników/i)).toBeInTheDocument();
  });
});