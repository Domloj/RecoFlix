import * as React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    initialValues: {
      username: '',
      email: '',
      password: '',
    },
    validate: {
      username: (value) => (value.length < 3 ? 'Nazwa musi mieć min. 3 znaki' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Niepoprawny format email'),
      password: (value) => (value.length < 6 ? 'Hasło musi mieć co najmniej 6 znaków' : null),
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    setError(null);
    try {
      await registerUser(values); 
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      setError('Błąd rejestracji. Upewnij się, że email nie jest już zajęty.');
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Dołącz do RecoFlix</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Masz już konto?{' '}
        <Anchor component={Link} to="/login" size="sm">
          Zaloguj się
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Text c="red" size="sm" ta="center" mb="md">{error}</Text>}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Nazwa użytkownika"
            placeholder="Kinomaniak99"
            required
            {...form.getInputProps('username')}
          />
          <TextInput
            label="Email"
            placeholder="twoj@email.com"
            required
            mt="md"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Hasło"
            placeholder="Minimum 6 znaków"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit" color="green">
            Załóż konto
          </Button>
        </form>
      </Paper>
    </Container>
  );
}