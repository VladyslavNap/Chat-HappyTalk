/**
 * User model for authentication and user management.
 * Stored in Cosmos DB SQL with id as partition key.
 */
export interface User {
  /** Unique user ID (GUID) */
  id: string;
  /** Username (unique) */
  username: string;
  /** Email address (unique) */
  email: string;
  /** Hashed password */
  passwordHash: string;
  /** Display name for chat */
  displayName: string;
  /** User status (online, offline, away) */
  status?: 'online' | 'offline' | 'away';
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last login */
  lastLoginAt?: string;
  /** ISO 8601 timestamp of last activity (for presence tracking) */
  lastSeenAt?: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
}

export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
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

export interface AuthToken {
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
  expiresAt: string;
}
