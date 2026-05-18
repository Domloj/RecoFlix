import { Button, Group, Select, TextInput } from '@mantine/core';
import { IconRefresh, IconSearch } from '@tabler/icons-react';
import type { AdminFiltersProps } from '../../../interfaces/admin';
import classes from '../styles/AdminFilters.module.css';

const roleOptions = [
  { value: 'all', label: 'Wszyscy' },
  { value: 'user', label: 'Użytkownicy' },
  { value: 'admin', label: 'Administratorzy' },
];

export function AdminFilters({
  search,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
  onRefresh,
  isRefreshing,
}: AdminFiltersProps) {
  return (
    <>
      <Group justify="space-between" className={classes.panelHeader}>
        <div>
          <div className={classes.sectionTitle}>Użytkownicy</div>
          <div className={classes.sectionDescription}>
            Edytuj nazwę i rolę konta. Administrator nie może przypadkiem odebrać sobie roli.
          </div>
        </div>

        <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={onRefresh} loading={isRefreshing}>
          Odśwież
        </Button>
      </Group>

      <Group className={classes.filters} align="flex-end">
        <TextInput
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Szukaj po nazwie, mailu albo UID"
          leftSection={<IconSearch size={16} />}
          className={classes.searchInput}
        />

        <Select
          value={roleFilter}
          onChange={(value) => onRoleFilterChange((value as AdminFiltersProps['roleFilter']) || 'all')}
          data={roleOptions}
          label="Filtr roli"
          className={classes.roleFilter}
        />
      </Group>
    </>
  );
}