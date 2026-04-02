export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type Role = 'user' | 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  role: Role;
  username: string;
}
