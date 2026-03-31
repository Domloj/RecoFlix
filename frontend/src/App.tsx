import * as React from 'react';

import { useState } from 'react';
import { Container, Title, Text, Card, Image, Badge, Button, Group, Grid, Modal, Progress } from '@mantine/core';

const mockRecommendations = [
  {
    id: 1,
    title: 'Incepcja (2010)',
    match: 98,
    desc: 'Złodziej, który wykrada korporacyjne sekrety za pomocą technologii współdzielenia snów...',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    xaiReasons: [
      { label: 'Ulubiony reżyser (Nolan)', value: 45, color: 'blue' },
      { label: 'Gatunek (Sci-Fi)', value: 30, color: 'grape' },
      { label: 'Podobni użytkownicy', value: 25, color: 'teal' }
    ]
  },
  {
    id: 2,
    title: 'Interstellar (2014)',
    match: 85,
    desc: 'Grupa badaczy wyrusza w najważniejszą misję w dziejach ludzkości...',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    xaiReasons: [
      { label: 'Klimat (Kosmos)', value: 50, color: 'blue' },
      { label: 'Gatunek (Sci-Fi)', value: 35, color: 'grape' },
      { label: 'Podobni użytkownicy', value: 15, color: 'teal' }
    ]
  }
];

function App() {
  const [selectedXai, setSelectedXai] = useState<typeof mockRecommendations[0] | null>(null);

  return (
    <Container size="lg" py="xl">
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title order={1} size="h1" c="blue.4">RecoFlix 🎬</Title>
        <Text c="dimmed" mt="sm">Transparentny system rekomendacji filmowych (XAI)</Text>
      </header>

      <Grid>
        {mockRecommendations.map((movie) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={movie.id}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section>
                <Image src={movie.image} height={160} alt={movie.title} />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500}>{movie.title}</Text>
                <Badge color="green" variant="light">{movie.match}% Dopasowania</Badge>
              </Group>

              <Text size="sm" c="dimmed">{movie.desc}</Text>

              <Button 
                color="blue" 
                fullWidth 
                mt="md" 
                radius="md"
                onClick={() => setSelectedXai(movie)}
              >
                Dlaczego to polecamy? (XAI)
              </Button>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Modal 
        opened={selectedXai !== null} 
        onClose={() => setSelectedXai(null)} 
        title={<Text fw={700}>Wyjaśnienie modelu dla: {selectedXai?.title}</Text>}
        centered
      >
        <Text size="sm" mb="lg">
          Nasz model uznał, że ten film spodoba Ci się na {selectedXai?.match}%. 
          Oto czynniki (wagi), które miały największy wpływ na tę decyzję:
        </Text>

        {selectedXai?.xaiReasons.map((reason, index) => (
          <div key={index} style={{ marginBottom: '15px' }}>
            <Group justify="space-between" mb={5}>
              <Text size="sm" fw={500}>{reason.label}</Text>
              <Text size="sm">{reason.value}%</Text>
            </Group>
            <Progress value={reason.value} color={reason.color} size="lg" radius="xl" />
          </div>
        ))}
      </Modal>
    </Container>
  );
}

export default App;