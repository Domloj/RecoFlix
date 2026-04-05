import * as React from 'react';
import { Affix, ActionIcon, Transition, Paper, Text, TextInput, ScrollArea, Group, Loader } from '@mantine/core';
import { IconMessageCircle, IconX, IconSend } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../services/apiService';
import ReactMarkdown from 'react-markdown';
import classes from './styles/ChatWidget.module.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'ai', content: 'Cześć! Z chęcią polecę Ci jakiś film. Na co masz dzisiaj ochotę?' }
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!user) return null;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const data = await fetchWithAuth('/chat/', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage, history: [] })
      });

      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Wystąpił błąd podczas łączenia z AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

return (
    <>
      <Affix position={{ bottom: 20, right: 20 }} zIndex={100}>
        <Transition transition="slide-up" mounted={isOpen}>
          {(transitionStyles) => (
            <Paper
              withBorder
              shadow="xl"
              radius="md"
              p="md"
              mb="md"
              w={350} 
              h={450} 
              display="flex" 
              style={{ flexDirection: 'column', ...transitionStyles }} 
            >
              <Group justify="space-between" mb="md">
                <Text fw={700} c="blue">Asystent RecoFlix</Text>
                <ActionIcon variant="subtle" color="gray" onClick={() => setIsOpen(false)}>
                  <IconX size={18} />
                </ActionIcon>
              </Group>

              <ScrollArea flex={1} viewportRef={scrollRef} pr="sm">
                {messages.map((msg, index) => (
                  <Paper
                    key={index}
                    bg={msg.role === 'user' ? 'blue.6' : 'gray.1'}
                    c={msg.role === 'user' ? 'white' : 'black'}
                    p="xs"
                    radius="md"
                    mb="sm"
                    ml={msg.role === 'user' ? 'auto' : 0}
                    mr={msg.role === 'ai' ? 'auto' : 0}
                    maw="85%" 
                  >
                    {msg.role === 'ai' ? (
                      <Text size="sm" component="div" className={classes.markdownContent}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </Text>
                    ) : (
                      <Text size="sm">{msg.content}</Text>
                    )}
                  </Paper>
                ))}
                {isLoading && (
                  <Group mt="sm">
                    <Loader size="xs" type="dots" />
                  </Group>
                )}
              </ScrollArea>

              <TextInput
                mt="md"
                placeholder="Napisz do mnie..."
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                rightSection={
                  <ActionIcon variant="filled" color="blue" onClick={handleSend} disabled={!input.trim() || isLoading}>
                    <IconSend size={16} />
                  </ActionIcon>
                }
              />
            </Paper>
          )}
        </Transition>

        {!isOpen && (
          <ActionIcon
            variant="filled"
            color="blue"
            radius="xl"
            onClick={() => setIsOpen(true)}
            w={60}
            h={60}
            style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
          >
            <IconMessageCircle size={32} />
          </ActionIcon>
        )}
      </Affix>
    </>
  );
}