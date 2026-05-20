import { Card, Image, Text, Group, Badge, ActionIcon } from '@mantine/core';
import { IconThumbUp, IconThumbDown } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import type { MovieListItem, MovieInteractionState } from '../../interfaces/movies';
import classes from './styles/MovieCard.module.css';
import { useAuth } from '../../context/AuthContext';
import { getMovieStatus, toggleLike, toggleDislike } from '../../services/userLikesService';

interface MovieCardProps {
  movie: MovieListItem;
  onClick?: (movie: MovieListItem) => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<MovieInteractionState>({ liked: false, disliked: false, isLoading: false });

  const handleActivate = () => {
    onClick?.(movie);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) return;
      setInteraction((s) => ({ ...s, isLoading: true }));
      try {
        const status = await getMovieStatus(user.uid, movie.id);
        if (!mounted) return;
        setInteraction({ liked: status.liked, disliked: status.disliked, isLoading: false });
      } catch (err) {
        if (!mounted) return;
        setInteraction((s) => ({ ...s, isLoading: false }));
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user, movie.id]);

  const handleLike = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    // optimistic update
    setInteraction((s) => ({ ...s, isLoading: true, liked: !s.liked, disliked: s.liked ? s.disliked : false }));
    try {
      await toggleLike(user.uid, movie.id);
    } catch (err) {
      const status = await getMovieStatus(user.uid, movie.id);
      setInteraction({ liked: status.liked, disliked: status.disliked, isLoading: false });
      return;
    }
    setInteraction((s) => ({ ...s, isLoading: false }));
  };

  const handleDislike = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setInteraction((s) => ({ ...s, isLoading: true, disliked: !s.disliked, liked: s.disliked ? s.liked : false }));
    try {
      await toggleDislike(user.uid, movie.id);
    } catch (err) {
      const status = await getMovieStatus(user.uid, movie.id);
      setInteraction({ liked: status.liked, disliked: status.disliked, isLoading: false });
      return;
    }
    setInteraction((s) => ({ ...s, isLoading: false }));
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

      <div className={classes.actions}>
        <ActionIcon
          onClick={handleLike}
          variant={interaction.liked ? 'filled' : 'outline'}
          color="green"
          size="lg"
          disabled={interaction.isLoading || !user}
          title={user ? (interaction.liked ? 'Usuń polubienie' : 'Polub') : 'Zaloguj się, aby ocenić'}
          aria-pressed={interaction.liked}
        >
          <IconThumbUp />
        </ActionIcon>

        <ActionIcon
          onClick={handleDislike}
          variant={interaction.disliked ? 'filled' : 'outline'}
          color="red"
          size="lg"
          disabled={interaction.isLoading || !user}
          title={user ? (interaction.disliked ? 'Usuń niechęć' : 'Nie podoba się') : 'Zaloguj się, aby ocenić'}
          aria-pressed={interaction.disliked}
        >
          <IconThumbDown />
        </ActionIcon>
      </div>
    </Card>
  );
}
