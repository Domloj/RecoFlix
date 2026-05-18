import { useEffect, useMemo, useState } from 'react';
import { Container, Paper, Text } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import type { AdminDraftState, AdminRoleFilter, AdminUserRecord, AdminUserDraft } from '../../interfaces/admin';
import { buildAdminStats, fetchAdminUsers, updateAdminUser } from '../../services/adminService';
import classes from './styles/AdminPage.module.css';
import { AdminHero } from './components/AdminHero';
import { AdminStatsGrid } from './components/AdminStatsGrid';
import { AdminFilters } from './components/AdminFilters';
import { AdminUsersTable } from './components/AdminUsersTable';
import { AdminNotice } from './components/AdminNotice';

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>('all');
  const [drafts, setDrafts] = useState<AdminDraftState>({});

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const records = await fetchAdminUsers();
      setUsers(records);
      setDrafts(
        records.reduce<AdminDraftState>((accumulator, record) => {
          accumulator[record.uid] = {
            username: record.username,
            role: record.role,
          };
          return accumulator;
        }, {}),
      );
    } catch (loadError) {
      setError('Nie udało się pobrać użytkowników. Sprawdź uprawnienia admina.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => buildAdminStats(users), [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        record.username.toLowerCase().includes(normalizedSearch) ||
        record.email.toLowerCase().includes(normalizedSearch) ||
        record.uid.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === 'all' || record.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  const handleDraftChange = (
    userId: string,
    field: keyof AdminUserDraft,
    value: string,
  ) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [userId]: {
        ...currentDrafts[userId],
        [field]: value,
      },
    }));
  };

  const handleSaveUser = async (record: AdminUserRecord) => {
    const draft = drafts[record.uid];

    if (!draft) {
      return;
    }

    try {
      setIsSavingId(record.uid);
      await updateAdminUser(record.uid, {
        username: draft.username.trim(),
        role: draft.role,
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.uid === record.uid
            ? { ...currentUser, username: draft.username.trim(), role: draft.role }
            : currentUser,
        ),
      );
    } catch (saveError) {
      setError('Nie udało się zapisać zmian użytkownika.');
    } finally {
      setIsSavingId(null);
    }
  };

  return (
    <Container size="xl" py={48} className={classes.adminPage}>
      <AdminHero
        title="Zarządzanie użytkownikami RecoFlix"
        description="Ten panel pokazuje bazę użytkowników, umożliwia zmianę nazw i ról oraz daje szybki wgląd w aktywność kont."
      />

      <AdminStatsGrid
        totalUsers={stats.totalUsers}
        adminUsers={stats.adminUsers}
        regularUsers={stats.regularUsers}
        recentUsers={stats.recentUsers}
      />

      <Paper withBorder className={classes.panel}>
        <AdminFilters
          search={search}
          roleFilter={roleFilter}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onRefresh={loadUsers}
          isRefreshing={isLoading}
        />

        {error ? (
          <Text c="red" mt="md">
            {error}
          </Text>
        ) : (
          <AdminUsersTable
            users={filteredUsers}
            drafts={drafts}
            currentUserUid={user?.uid}
            isLoading={isLoading}
            isSavingId={isSavingId}
            onDraftChange={handleDraftChange}
            onSaveUser={handleSaveUser}
          />
        )}
      </Paper>

      <AdminNotice
        title="Jak nadać rolę admina"
        message="Użytkownik nie powinien sam rejestrować się jako admin. Najbezpieczniej: zarejestruj konto normalnie, a potem nadaj custom claim admin: true przez Firebase Admin SDK i ustaw w dokumencie Firestore pole role na admin."
      />
    </Container>
  );
}