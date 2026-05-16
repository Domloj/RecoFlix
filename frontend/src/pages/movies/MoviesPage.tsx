import { useEffect, useMemo, useState } from 'react';
import { Container, Title, Text, SimpleGrid, Center, Loader, Pagination, Group, TextInput, Button, Modal, Image, Badge } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { MovieCard } from './MovieCard';
import { fetchMoviesPage } from '../../services/moviesService';
import type { MovieListItem } from '../../interfaces/movies';
import classes from './styles/MoviesPage.module.css';

export function MoviesPage() {
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<MovieListItem | null>(null);
  const pageSize = 50;

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMoviesPage({
          page,
          pageSize,
          query: searchQuery || undefined,
        });
        setMovies(data.items);
        setTotal(data.total);
      } catch (err) {
        setError('Nie udało się pobrać listy filmów. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [page, pageSize, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  return (
    <Container size="lg" py={60} className={classes.wrapper}>
      <Modal
        opened={Boolean(selectedMovie)}
        onClose={() => setSelectedMovie(null)}
        centered
        size="lg"
        overlayProps={{ opacity: 0.6, blur: 2, color: 'rgba(15, 23, 42, 0.7)' }}
        classNames={{ content: classes.modalContent, body: classes.modalBody, header: classes.modalHeader }}
        title={selectedMovie?.title}
      >
        {selectedMovie && (
          <div className={classes.modalLayout}>
            <Image
              src={selectedMovie.poster_url}
              alt={selectedMovie.title}
              radius="md"
              className={classes.modalPoster}
            />
            <div className={classes.modalDetails}>
              <Badge variant="light" color="cyan" size="lg">
                {selectedMovie.release_year}
              </Badge>
              <Text mt="md" className={classes.modalDescription}>
                {selectedMovie.description}
              </Text>
            </div>
          </div>
        )}
      </Modal>
      <div className={classes.header}>
        <Title order={1}>Biblioteka filmów</Title>
        <Text c="dimmed" mt="sm">
          Poznaj wszystkie tytuły dostępne w RecoFlix — wybierz coś na start, a potem zaczniemy
          personalizować rekomendacje.
        </Text>
      </div>

      {isLoading ? (
        <Center py={80}>
          <Loader size="lg" color="blue" />
        </Center>
      ) : error ? (
        <Center py={80}>
          <Text c="red">{error}</Text>
        </Center>
      ) : (
        <>
          <Group justify="center" className={classes.searchRow}>
            <div className={classes.searchShell}>
              <TextInput
                value={searchInput}
                onChange={(event) => setSearchInput(event.currentTarget.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                placeholder="Szukaj po tytule filmu"
                leftSection={<IconSearch size={16} />}
                rightSection={
                  searchInput ? (
                    <Button
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={handleClearSearch}
                      leftSection={<IconX size={14} />}
                      className={classes.clearButton}
                    >
                      Wyczyść
                    </Button>
                  ) : null
                }
                radius="xl"
                size="md"
                className={classes.searchInput}
                classNames={{ input: classes.searchInputField }}
              />
              <Button
                onClick={handleSearch}
                radius="xl"
                size="md"
                className={classes.searchButton}
              >
                Szukaj
              </Button>
            </div>
          </Group>
          <Group justify="center" className={classes.paginationInfo}>
            <Text c="dimmed">
              Strona {page} z {totalPages} · Wyświetlasz {movies.length} z {total} filmów
            </Text>
          </Group>
          {movies.length === 0 ? (
            <Center py={80}>
              <Text c="dimmed">Nie znaleziono filmów pasujących do frazy.</Text>
            </Center>
          ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" mt="xl">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
            ))}
          </SimpleGrid>
          )}
          <Center mt="xl">
            <Pagination value={page} onChange={setPage} total={totalPages} radius="xl" />
          </Center>
        </>
      )}
    </Container>
  );
}
