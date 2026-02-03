import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials, RegisterData } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  // UI state
  isLoginMode = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Login form
  loginData: LoginCredentials = {
    username: '',
    password: '',
  };

  // Registration form
  registerData: RegisterData = {
    username: '',
    email: '',
    password: '',
    displayName: '',
  };

  confirmPassword = '';

  /**
   * Toggle between login and registration mode.
   */
  toggleMode(): void {
    this.isLoginMode.set(!this.isLoginMode());
    this.errorMessage.set('');
  }

  /**
   * Handle login form submission.
   */
  async onLogin(): Promise<void> {
    this.errorMessage.set('');

    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage.set(response.error || 'Login failed');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('An error occurred during login');
      },
    });
  }

  /**
   * Handle registration form submission.
   */
  async onRegister(): Promise<void> {
    this.errorMessage.set('');

    // Validation
    if (
      !this.registerData.username ||
      !this.registerData.email ||
      !this.registerData.password ||
      !this.registerData.displayName
    ) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.errorMessage.set('Please enter a valid email address');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage.set(response.error || 'Registration failed');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('An error occurred during registration');
      },
    });
  }

  /**
   * Handle Enter key press in form inputs.
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.isLoginMode()) {
        this.onLogin();
      } else {
        this.onRegister();
      }
    }
  }
}
