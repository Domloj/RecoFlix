import { Group, Button, Text, Container, Flex, Box } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';
import { IconMovie, IconLogout, IconUser } from '@tabler/icons-react';
import classes from './styles/Navbar.module.css';

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Błąd wylogowywania:', error);
    }
  };

  return (
    <Box className={classes.header}>
      <Container size="lg" h={60}>
        <Flex justify="space-between" align="center" h="100%">
          
          <Link to="/" className={classes.logoLink}>
            <Group className={classes.logoGroup}>
              <IconMovie size={28} color="#339af0" />
              <Text 
                size="xl" 
                fw={800} 
                variant="gradient" 
                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              >
                RecoFlix
              </Text>
            </Group>
          </Link>

          <Group>
            {user ? (
              <>
                <Button 
                  component={Link} 
                  to="/profile" 
                  variant="subtle" 
                  color="gray" 
                  leftSection={<IconUser size={18} />}
                >
                  Mój Profil
                </Button>
                <Button 
                  variant="light" 
                  color="red" 
                  onClick={handleLogout} 
                  leftSection={<IconLogout size={18} />}
                >
                  Wyloguj
                </Button>
              </>
            ) : (
              <>
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="subtle" 
                  color="gray"
                >
                  Zaloguj
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="gradient" 
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  Załóż konto
                </Button>
              </>
            )}
          </Group>
        </Flex>
      </Container>
    </Box>
  );
}