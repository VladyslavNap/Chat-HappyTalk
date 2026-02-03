/**
 * Authentication models and interfaces for the client-side application.
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  error?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  status?: 'online' | 'offline' | 'away';
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
}
