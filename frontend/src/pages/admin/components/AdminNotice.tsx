import { Group, Paper, Text, Title } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import type { AdminNoticeProps } from '../../../interfaces/admin';
import classes from '../styles/AdminNotice.module.css';

export function AdminNotice({ title, message }: AdminNoticeProps) {
  return (
    <Paper withBorder className={classes.noticePanel}>
      <Group align="flex-start" className={classes.noticeGroup}>
        <IconUsersGroup size={22} className={classes.noticeIcon} />
        <div>
          <Title order={3} className={classes.noticeTitle}>
            {title}
          </Title>
          <Text c="dimmed" size="sm">
            {message}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}