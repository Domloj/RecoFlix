import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatWidget } from '../../src/components/ChatWidget';
import { MantineProvider } from '@mantine/core';

// mocks
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../src/services/apiService', () => ({
  fetchWithAuth: vi.fn(),
}));

Object.defineProperty(window.HTMLElement.prototype, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { useAuth } from '../../src/context/AuthContext';
import { fetchWithAuth } from '../../src/services/apiService';

const renderWithMantine = (component: React.ReactNode) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('Komponent ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nie renderuje się, gdy użytkownik nie jest zalogowany', () => {
    (useAuth as any).mockReturnValue({ user: null });

    renderWithMantine(<ChatWidget />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Asystent RecoFlix')).not.toBeInTheDocument();
  });

  it('renderuje zamknięty widget (przycisk FAB), gdy użytkownik jest zalogowany', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123' } });

    renderWithMantine(<ChatWidget />);

    expect(screen.queryByText('Asystent RecoFlix')).not.toBeInTheDocument();
    
    const fabButton = screen.getByRole('button');
    expect(fabButton).toBeInTheDocument();
  });

  it('otwiera okno czatu po kliknięciu w przycisk', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123' } });
    renderWithMantine(<ChatWidget />);

    const fabButton = screen.getByRole('button');
    fireEvent.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('Asystent RecoFlix')).toBeInTheDocument();
    });

    expect(screen.getByText(/Cześć! Z chęcią polecę Ci jakiś film/i)).toBeInTheDocument();
  });

  it('wysyła wiadomość do API, renderuje dymki i czyści input', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123' } });
    
    const mockAiResponse = { response: 'Polecam film Matrix (1999).' };
    (fetchWithAuth as any).mockResolvedValue(mockAiResponse);

    renderWithMantine(<ChatWidget />);

    const openButton = screen.getByRole('button');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Napisz do mnie...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Napisz do mnie...');
    fireEvent.change(input, { target: { value: 'Poleć mi dobre Sci-Fi' } });

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(input).toHaveValue('');

    expect(screen.getByText('Poleć mi dobre Sci-Fi')).toBeInTheDocument();

    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(fetchWithAuth).toHaveBeenCalledWith('/chat/', {
      method: 'POST',
      body: JSON.stringify({ message: 'Poleć mi dobre Sci-Fi', history: [] }),
    });
  });
});