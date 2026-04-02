import * as React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Niepoprawny format email'),
      password: (value) => (value.length < 6 ? 'Hasło musi mieć co najmniej 6 znaków' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      navigate('/profile'); 
    } catch (err: any) {
      setError('Nieprawidłowy email lub hasło.');
    }
  };
  return (
    <Container size={420} my={40}>
      <Title ta="center">Witaj ponownie w RecoFlix!</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Nie masz jeszcze konta?{' '}
        <Anchor component={Link} to="/register" size="sm">
          Zarejestruj się
        </Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Text c="red" size="sm" ta="center" mb="md">{error}</Text>}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="twoj@email.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Hasło"
            placeholder="Twoje tajne hasło"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit">
            Zaloguj się
          </Button>
        </form>
      </Paper>
    </Container>
  );
}