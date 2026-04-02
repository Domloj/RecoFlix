import { useState } from 'react';
import { Container, Title, Paper, Text, Avatar, Group, Button, TextInput } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { updateUsernameInDb } from '../../services/userService';

export function ProfilePage() {
  const { user, setUser } = useAuth(); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');

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