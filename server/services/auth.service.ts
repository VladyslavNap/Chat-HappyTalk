import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { CosmosService } from './cosmos.service.js';
import {
  User,
  UserProfile,
  RegisterUserRequest,
  LoginRequest,
  LoginResponse,
  AuthToken,
} from '../models/user.js';

/**
 * Authentication service for user management and session handling.
 */
export class AuthService {
  private activeSessions: Map<string, AuthToken> = new Map();
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(private cosmosService: CosmosService) {}

  /**
   * Hash a password using SHA256.
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Generate a secure authentication token.
   */
  private generateToken(): string {
    return randomUUID() + '-' + randomUUID();
  }

  /**
   * Convert User to UserProfile (without sensitive data).
   */
  private toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Register a new user.
   */
  async register(request: RegisterUserRequest): Promise<LoginResponse> {
    try {
      // Validate input
      if (!request.username || !request.email || !request.password || !request.displayName) {
        return { success: false, error: 'All fields are required' };
      }

      // Check if username already exists
      const existingUser = await this.cosmosService.getUserByUsername(request.username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Check if email already exists
      const existingEmail = await this.cosmosService.getUserByEmail(request.email);
      if (existingEmail) {
        return { success: false, error: 'Email already exists' };
      }

      // Create new user
      const user: User = {
        id: randomUUID(),
        username: request.username.toLowerCase().trim(),
        email: request.email.toLowerCase().trim(),
        passwordHash: this.hashPassword(request.password),
        displayName: request.displayName.trim(),
        status: 'online',
        createdAt: new Date().toISOString(),
      };

      // Save user to database
      await this.cosmosService.createUser(user);

      // Create session token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      const authToken: AuthToken = {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      this.activeSessions.set(token, authToken);

      return {
        success: true,
        token,
        user: this.toUserProfile(user),
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Login a user.
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Validate input
      if (!request.username || !request.password) {
        return { success: false, error: 'Username and password are required' };
      }

      // Find user
      const user = await this.cosmosService.getUserByUsername(
        request.username.toLowerCase().trim()
      );
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password
      const passwordHash = this.hashPassword(request.password);
      if (user.passwordHash !== passwordHash) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Update last login
      await this.cosmosService.updateUserLastLogin(user.id);

      // Create session token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      const authToken: AuthToken = {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      this.activeSessions.set(token, authToken);

      // Update user status to online
      await this.cosmosService.updateUserStatus(user.id, 'online');

      return {
        success: true,
        token,
        user: this.toUserProfile(user),
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Logout a user.
   */
  async logout(token: string): Promise<boolean> {
    try {
      const authToken = this.activeSessions.get(token);
      if (authToken) {
        // Update user status to offline
        await this.cosmosService.updateUserStatus(authToken.userId, 'offline');
        this.activeSessions.delete(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Validate a token and return the auth token if valid.
   */
  validateToken(token: string): AuthToken | null {
    const authToken = this.activeSessions.get(token);
    if (!authToken) {
      return null;
    }

    // Check if token is expired
    const expiresAt = new Date(authToken.expiresAt);
    if (expiresAt < new Date()) {
      this.activeSessions.delete(token);
      return null;
    }

    return authToken;
  }

  /**
   * Get user profile by token.
   */
  async getUserByToken(token: string): Promise<UserProfile | null> {
    try {
      const authToken = this.validateToken(token);
      if (!authToken) {
        return null;
      }

      const user = await this.cosmosService.getUserById(authToken.userId);
      if (!user) {
        return null;
      }

      return this.toUserProfile(user);
    } catch (error) {
      console.error('Get user by token error:', error);
      return null;
    }
  }

  /**
   * Get all online users.
   */
  async getOnlineUsers(): Promise<UserProfile[]> {
    try {
      const users = await this.cosmosService.getOnlineUsers();
      return users.map((user) => this.toUserProfile(user));
    } catch (error) {
      console.error('Get online users error:', error);
      return [];
    }
  }
}
