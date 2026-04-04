import { auth } from '../config/firebase';

const API_URL = 'http://localhost:8000/api';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Użytkownik niezalogowany");

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) throw new Error("Błąd komunikacji z API");
  return response.json();
};