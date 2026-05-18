import { Paper, SimpleGrid, Text } from '@mantine/core';
import type { AdminStatsGridProps } from '../../../interfaces/admin';
import classes from '../styles/AdminStatsGrid.module.css';

export function AdminStatsGrid({ totalUsers, adminUsers, regularUsers, recentUsers }: AdminStatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" className={classes.statsGrid}>
      <Paper withBorder className={classes.statCard}>
        <Text c="dimmed" size="sm">
          Łącznie kont
        </Text>
        <Text fw={800} size="xl">
          {totalUsers}
        </Text>
      </Paper>
      <Paper withBorder className={classes.statCard}>
        <Text c="dimmed" size="sm">
          Administratorzy
        </Text>
        <Text fw={800} size="xl">
          {adminUsers}
        </Text>
      </Paper>
      <Paper withBorder className={classes.statCard}>
        <Text c="dimmed" size="sm">
          Zwykli użytkownicy
        </Text>
        <Text fw={800} size="xl">
          {regularUsers}
        </Text>
      </Paper>
      <Paper withBorder className={classes.statCard}>
        <Text c="dimmed" size="sm">
          Nowe konta 7 dni
        </Text>
        <Text fw={800} size="xl">
          {recentUsers}
        </Text>
      </Paper>
    </SimpleGrid>
  );
}