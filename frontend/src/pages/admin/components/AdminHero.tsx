import { Badge, Text, Title } from '@mantine/core';
import { IconShield } from '@tabler/icons-react';
import type { AdminHeroProps } from '../../../interfaces/admin';
import classes from '../styles/AdminHero.module.css';

export function AdminHero({ title, description }: AdminHeroProps) {
  return (
    <div className={classes.hero}>
      <Badge variant="light" color="blue" size="lg" radius="xl" leftSection={<IconShield size={14} />}>
        Panel administracyjny
      </Badge>
      <Title order={1} className={classes.title}>
        {title}
      </Title>
      <Text c="dimmed" className={classes.subtitle}>
        {description}
      </Text>
    </div>
  );
}