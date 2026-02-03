import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserProfile,
  AuthState,
} from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'happytalk_auth_token';
  private readonly USER_KEY = 'happytalk_user';

  // Auth state signals
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  authState$ = this.authStateSubject.asObservable();
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.loadAuthState();
  }

  /**
   * Load authentication state from localStorage on service initialization.
   */
  private loadAuthState(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as UserProfile;
        this.setAuthState(token, user);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        this.clearAuthState();
      }
    }
  }

  /**
   * Set authentication state.
   */
  private setAuthState(token: string, user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.isAuthenticated.set(true);
    this.currentUser.set(user);

    this.authStateSubject.next({
      isAuthenticated: true,
      user,
      token,
    });
  }

  /**
   * Clear authentication state.
   */
  private clearAuthState(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('happytalk_username'); // Legacy cleanup

    this.isAuthenticated.set(false);
    this.currentUser.set(null);

    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  }

  /**
   * Get authorization headers with token.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Register a new user.
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, data).pipe(
      tap((response) => {
        if (response.success && response.token && response.user) {
          this.setAuthState(response.token, response.user);
        }
      }),
      catchError((error) => {
        console.error('Registration error:', error);
        return of({
          success: false,
          error: error.error?.error || 'Registration failed',
        });
      })
    );
  }

  /**
   * Login a user.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.token && response.user) {
          this.setAuthState(response.token, response.user);
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return of({
          success: false,
          error: error.error?.error || 'Login failed',
        });
      })
    );
  }

  /**
   * Logout the current user.
   */
  logout(): Observable<{ success: boolean }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/api/auth/logout`, {}, { headers }).pipe(
      tap(() => {
        this.clearAuthState();
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        // Clear local state even if API call fails
        this.clearAuthState();
        this.router.navigate(['/login']);
        return of({ success: false });
      })
    );
  }

  /**
   * Get current user profile from server.
   */
  getCurrentUser(): Observable<UserProfile | null> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserProfile>(`${environment.apiUrl}/api/auth/me`, { headers }).pipe(
      tap((user) => {
        this.currentUser.set(user);
      }),
      catchError((error) => {
        console.error('Get current user error:', error);
        if (error.status === 401) {
          this.clearAuthState();
        }
        return of(null);
      })
    );
  }

  /**
   * Get online users.
   */
  getOnlineUsers(): Observable<UserProfile[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserProfile[]>(`${environment.apiUrl}/api/users/online`, { headers }).pipe(
      catchError((error) => {
        console.error('Get online users error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get the authentication token.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated.
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }
}
