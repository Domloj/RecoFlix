import { Button, Center, Loader, Select, Table, Text, TextInput } from '@mantine/core';
import type { AdminUsersTableProps } from '../../../interfaces/admin';
import classes from '../styles/AdminUsersTable.module.css';

export function AdminUsersTable({
  users,
  drafts,
  currentUserUid,
  isLoading,
  isSavingId,
  onDraftChange,
  onSaveUser,
}: AdminUsersTableProps) {
  if (isLoading) {
    return (
      <Center py={64}>
        <Loader color="blue" size="lg" />
      </Center>
    );
  }

  return (
    <div className={classes.tableShell}>
      <Table striped highlightOnHover className={classes.table}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Użytkownik</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Rola</Table.Th>
            <Table.Th>Utworzono</Table.Th>
            <Table.Th className={classes.actionsColumn}>Akcje</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((record) => {
            const draft = drafts[record.uid];
            const isCurrentAdmin = currentUserUid === record.uid;
            const hasChanges =
              draft && (draft.username !== record.username || draft.role !== record.role);

            return (
              <Table.Tr key={record.uid}>
                <Table.Td>
                  <div className={classes.userCell}>
                    <TextInput
                      value={draft?.username ?? record.username}
                      onChange={(event) => onDraftChange(record.uid, 'username', event.currentTarget.value)}
                      className={classes.inlineInput}
                    />
                    <Text size="xs" c="dimmed">
                      {record.uid}
                    </Text>
                  </div>
                </Table.Td>
                <Table.Td>{record.email}</Table.Td>
                <Table.Td>
                  <Select
                    value={draft?.role ?? record.role}
                    onChange={(value) => onDraftChange(record.uid, 'role', (value as 'user' | 'admin') || 'user')}
                    data={[
                      { value: 'user', label: 'user' },
                      { value: 'admin', label: 'admin' },
                    ]}
                    className={classes.inlineSelect}
                    disabled={isCurrentAdmin}
                  />
                  {isCurrentAdmin && (
                    <Text size="xs" c="dimmed" mt={4}>
                      To jest Twoje konto.
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{record.createdAt ? record.createdAt.slice(0, 10) : 'brak danych'}</Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    onClick={() => onSaveUser(record)}
                    loading={isSavingId === record.uid}
                    disabled={!hasChanges || (isCurrentAdmin && draft?.role !== record.role)}
                  >
                    Zapisz
                  </Button>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {users.length === 0 && (
        <Center py={48}>
          <Text c="dimmed">Brak użytkowników pasujących do filtrów.</Text>
        </Center>
      )}
    </div>
  );
}