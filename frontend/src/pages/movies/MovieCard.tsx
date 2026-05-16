import { Card, Image, Text, Group, Badge } from '@mantine/core';
import type { MovieListItem } from '../../interfaces/movies';
import classes from './styles/MovieCard.module.css';

interface MovieCardProps {
  movie: MovieListItem;
  onClick?: (movie: MovieListItem) => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const handleActivate = () => {
    onClick?.(movie);
  };

  return (
    <Card
      withBorder
      radius="md"
      shadow="sm"
      className={classes.card}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleActivate();
        }
      }}
    >
      <Card.Section className={classes.posterSection}>
        <Image src={movie.poster_url} alt={movie.title} height={260} fit="cover" />
      </Card.Section>
      <Group justify="space-between" mt="md" mb="xs" align="flex-start">
        <Text fw={700} className={classes.title}>
          {movie.title}
        </Text>
        <Badge variant="light" color="cyan">
          {movie.release_year}
        </Badge>
      </Group>
      <Text size="sm" c="dimmed" className={classes.description}>
        {movie.description}
      </Text>
    </Card>
  );
}
