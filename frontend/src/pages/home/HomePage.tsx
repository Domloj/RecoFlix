import { Container, Title, Text, Button, Group, Badge, Paper } from '@mantine/core';
import { motion, type Variants } from 'framer-motion'; 
import { Link } from 'react-router-dom';
import { IconSparkles, IconBrain } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import classes from './styles/HomePage.module.css';

export function HomePage() {
  const { user } = useAuth();

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut' } 
    }
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: { 
      transition: { staggerChildren: 0.2 } 
    }
  };

  return (
    <Container size="lg" py={80}>
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
      >
        
        <motion.div variants={fadeInUp} className={classes.badgeWrapper}>
          <Badge variant="light" color="blue" size="lg" radius="xl" leftSection={<IconSparkles size={14} />}>
            Nowa era rekomendacji
          </Badge>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Title order={1} size="4rem" ta="center" fw={900} lts={-2} mb="md">
            Odkryj kino na nowo z{' '}
            <Text component="span" variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 45 }} inherit>
              Explainable AI
            </Text>
          </Title>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Text c="dimmed" ta="center" size="xl" mb="xl" className={classes.heroText}>
            Masz dość filmów „polecanych dla Ciebie", które kompletnie nie trafiają w gust?
            RecoFlix pokazuje, dlaczego coś trafiło na Twoją listę — nie ukrywa logiki za kurtyną.
            Zobaczysz konkretne powody, a nie tylko gwiazdki.
          </Text>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Group justify="center" mt="xl">
            <Button 
              component={Link} 
              to={user ? "/reco" : "/register"} 
              size="xl" 
              radius="xl" 
              variant="gradient" 
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              leftSection={<IconBrain size={24} />}
              className={classes.actionButton}
            >
              {user ? 'Pokaż moje rekomendacje' : 'Wypróbuj za darmo'}
            </Button>
          </Group>
        </motion.div>

        <motion.div variants={fadeInUp} className={classes.featuresSection}>
          <Group grow align="flex-start">
            <Paper withBorder shadow="md" p="xl" radius="md" className={classes.featureCard}>
              <Text size="xl" fw={700} mb="sm" c="blue.4">1. Oceń kilka filmów</Text>
              <Text c="dimmed">
                Zaznacz, co już widziałeś i co Ci się podobało. Nie musisz oceniać setek tytułów — 
                kilka wystarczy, żeby system złapał Twój gust.
              </Text>
            </Paper>
            <Paper withBorder shadow="md" p="xl" radius="md" className={classes.featureCard}>
              <Text size="xl" fw={700} mb="sm" c="cyan.4">2. Dowiedz się, dlaczego</Text>
              <Text c="dimmed">
                Przy każdej rekomendacji zobaczysz, co zadecydowało o wyborze — 
                czy to reżyser, klimat, czy gatunek.
              </Text>
            </Paper>
          </Group>
        </motion.div>

      </motion.div>
    </Container>
  );
}