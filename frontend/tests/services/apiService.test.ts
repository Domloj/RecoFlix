import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithAuth } from '../../src/services/apiService';
import { auth } from '../../src/config/firebase';

// mocks
vi.mock('../../src/config/firebase', () => ({
  auth: {
    currentUser: null, 
  },
}));

// test
describe('apiService - fetchWithAuth', () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (auth as any).currentUser = null; 
  });

  it('rzuca błąd "Użytkownik niezalogowany", gdy brakuje currentUser', async () => {
    (auth as any).currentUser = null;

    await expect(fetchWithAuth('/test-endpoint')).rejects.toThrow('Użytkownik niezalogowany');
    
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rzuca błąd "Błąd komunikacji z API", gdy serwer zwróci status inny niż OK (np. 500 lub 404)', async () => {
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue('fake-jwt-token'),
    };

    fetchMock.mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(fetchWithAuth('/test-endpoint')).rejects.toThrow('Błąd komunikacji z API');
  });

  it('wysyła prawidłowe zapytanie z tokenem i zwraca dane, gdy serwer odpowie poprawnie', async () => {
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue('super-tajny-token'),
    };

    const mockData = { status: 'online', engine: 'XAI' };
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    } as unknown as Response);

    const result = await fetchWithAuth('/status');

    expect(result).toEqual(mockData);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer super-tajny-token',
      },
    });
  });
});