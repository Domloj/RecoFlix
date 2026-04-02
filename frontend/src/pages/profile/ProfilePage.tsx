import { useEffect, useState } from 'react';
import { Container, Title, Paper, Text, Avatar, Group, Button, TextInput, Badge } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { updateUsernameInDb } from '../../services/userService';
import { fetchWithAuth } from '../../services/apiService';

export function ProfilePage() {
  const { user, setUser } = useAuth(); 
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [engineStatus, setEngineStatus] = useState<{status: string, engine: string} | null>(null);

  useEffect(() => {
    const checkEngine = async () => {
      try {
        const data = await fetchWithAuth('/engine-status');
        setEngineStatus(data);
      } catch (err) {
        console.error("Silnik AI jest offline");
      }
    };
    checkEngine();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateUsernameInDb(user.uid, newUsername);
      setUser({ ...user, username: newUsername });
      setIsEditing(false);
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xs" mb="md" radius="md">
        <Group justify="space-between">
          <Text size="sm" fw={500}>Status Silnika AI:</Text>
          {engineStatus ? (
            <Badge color="green" variant="light">Połączono: {engineStatus.engine}</Badge>
          ) : (
            <Badge color="red" variant="light">Offline</Badge>
          )}
        </Group>
      </Paper>
      <Paper withBorder shadow="md" p="xl" radius="md">
        <Group justify="space-between" mb="xl">
          <Group>
            <Avatar size="xl" radius="xl" color="blue">
              {user?.username?.substring(0, 2).toUpperCase()}
            </Avatar>
            <div>
              {isEditing ? (
                <TextInput 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.currentTarget.value)} 
                  label="Nowa nazwa"
                />
              ) : (
                <Title order={2}>{user?.username}</Title>
              )}
              <Text c="dimmed">{user?.email}</Text>
              <Text size="xs" c="blue">Rola: {user?.role}</Text>
            </div>
          </Group>
          <Button 
            variant="light" 
            onClick={isEditing ? handleUpdateProfile : () => setIsEditing(true)}
          >
            {isEditing ? 'Zapisz' : 'Edytuj profil'}
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}