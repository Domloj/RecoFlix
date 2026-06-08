import { useEffect, useState } from 'react';
import {
  Container, Title, Text, SimpleGrid, Center, Loader,
  Card, Image, Badge, Group, Progress, Paper, Button,
} from '@mantine/core';
import { IconBrain, IconMovie } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getUserLikes } from '../../services/userLikesService';
import { fetchRecommendationsForUser } from '../../services/recommendationsService';
import type { MovieRecommendation } from '../../services/recommendationsService';
import classes from './styles/RecoPage.module.css';

export function RecoPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLikes, setHasLikes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        setError(null);

        const likedIds = await getUserLikes(user.uid);

        if (likedIds.length === 0) {
          setHasLikes(false);
          return;
        }

        const data = await fetchRecommendationsForUser(likedIds);
        setRecommendations(data);
      } catch (err) {
        setError('Nie udało się pobrać rekomendacji. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  if (isLoading) {
    return (
      <Center py={120}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="lg" color="blue" />
          <Text c="dimmed" mt="md">Analizujemy Twój gust filmowy…</Text>
        </div>
      </Center>
    );
  }

  if (!hasLikes) {
    return (
      <Container size="sm" py={100}>
        <Paper withBorder shadow="md" p="xl" radius="md" className={classes.emptyState}>
          <IconBrain size={48} color="var(--mantine-color-blue-4)" />
          <Title order={2} mt="md">Za mało danych</Title>
          <Text c="dimmed" mt="sm">
            Oceń kilka filmów w bibliotece — wystarczy kilka polubień, żeby silnik złapał Twój gust.
          </Text>
          <Button
            component={Link}
            to="/movies"
            mt="xl"
            radius="xl"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            leftSection={<IconMovie size={18} />}
          >
            Przeglądaj bibliotekę
          </Button>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Center py={120}>
        <Text c="red">{error}</Text>
      </Center>
    );
  }

  return (
    <Container size="lg" py={60}>
      <div className={classes.header}>
        <Title order={1}>Twoje rekomendacje</Title>
        <Text c="dimmed" mt="sm">
          Na podstawie filmów, które polubiłaś — oto co może Ci się spodobać.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" mt="xl">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.movie_id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
          >
            <Card withBorder radius="md" shadow="sm" className={classes.card}>
              <Card.Section>
                <Image src={rec.poster_url} alt={rec.title} height={260} fit="cover" />
              </Card.Section>

              <Text fw={700} mt="md" mb={4} className={classes.title}>
                {rec.title}
              </Text>

              {/* Sekcja XAI */}
              <Paper className={classes.xaiBox} p="sm" radius="sm">
                <Text size="xs" fw={600} c="dimmed" mb={6} tt="uppercase" lts={0.5}>
                  Dlaczego ten film?
                </Text>

                <Group gap={6} mb={6}>
                  <Badge size="xs" color="cyan" variant="light">Treść</Badge>
                  <Badge size="xs" color="violet" variant="light">Społeczność</Badge>
                </Group>

                <Group gap={6} mb={6} justify="space-between">
                    <Badge size="xs" color="cyan" variant="light">
                        Treść {rec.xai.content_contribution_pct.toFixed(0)}%
                    </Badge>
                    <Badge size="xs" color="violet" variant="light">
                        Społeczność {rec.xai.collaborative_contribution_pct.toFixed(0)}%
                    </Badge>
                    </Group>

                    <Progress.Root size="sm" radius="xl" mb={8}>
                    <Progress.Section
                        value={rec.xai.content_contribution_pct}
                        color="cyan"
                    />
                    <Progress.Section
                        value={rec.xai.collaborative_contribution_pct}
                        color="violet"
                    />
                    </Progress.Root>

                <Text size="xs" c="dimmed" lh={1.5}>
                  {rec.xai.human_explanation}
                </Text>
              </Paper>
            </Card>
          </motion.div>
        ))}
      </SimpleGrid>
    </Container>
  );
}