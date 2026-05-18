import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';

import type { AdminDraftState, AdminUserRecord } from '../../../src/interfaces/admin';
import { AdminUsersTable } from '../../../src/pages/admin/components/AdminUsersTable';

const users: AdminUserRecord[] = [
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

const renderTable = (overrides?: Partial<{ drafts: AdminDraftState; currentUserUid: string | undefined; isLoading: boolean }>) => {
  const onDraftChange = vi.fn();
  const onSaveUser = vi.fn();

  function Harness() {
    const [drafts, setDrafts] = useState<AdminDraftState>(
      overrides?.drafts ?? {
        'user-2': { username: 'Alice', role: 'user' },
      },
    );

    const handleDraftChange = (userId: string, field: keyof AdminDraftState[string], value: string) => {
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [userId]: {
          ...currentDrafts[userId],
          [field]: value,
        },
      }));
      onDraftChange(userId, field, value);
    };

    return (
      <AdminUsersTable
        users={users}
        drafts={drafts}
        currentUserUid={overrides?.currentUserUid ?? 'admin-1'}
        isLoading={overrides?.isLoading ?? false}
        isSavingId={null}
        onDraftChange={handleDraftChange}
        onSaveUser={onSaveUser}
      />
    );
  }

  render(
    <MantineProvider>
      <Harness />
    </MantineProvider>,
  );

  return { onDraftChange, onSaveUser };
};

describe('AdminUsersTable', () => {
  it('shows loading state while data is being fetched', () => {
    // Arrange
    renderTable({ isLoading: true });

    // Act & Assert
    expect(screen.getByLabelText(/ładowanie użytkowników/i)).toBeInTheDocument();
  });

  it('renders users and allows editing and saving a row', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onDraftChange, onSaveUser } = renderTable();

    // Act
    const aliceRow = screen.getByText('alice@example.com').closest('tr');
    expect(aliceRow).not.toBeNull();

    const usernameInput = screen.getByDisplayValue('Alice') as HTMLInputElement;
    await user.clear(usernameInput);
    await user.type(usernameInput, 'Alicia');

    const saveButton = within(aliceRow as HTMLTableRowElement).getByRole('button', { name: /zapisz/i });
    await user.click(saveButton);

    // Assert
    expect(onDraftChange).toHaveBeenCalledWith('user-2', 'username', expect.any(String));
    expect(onSaveUser).toHaveBeenCalledWith(users[1]);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('2026-05-12')).toBeInTheDocument();
  });

  it('disables the save action for the current admin row when role is unchanged', () => {
    // Arrange
    renderTable({
      drafts: {
        'admin-1': { username: 'Admin One', role: 'admin' },
      },
      currentUserUid: 'admin-1',
    });

    // Act
    const adminRow = screen.getByText('admin@example.com').closest('tr');

    // Assert
    expect(within(adminRow as HTMLTableRowElement).getByRole('button', { name: /zapisz/i })).toBeDisabled();
  });
});