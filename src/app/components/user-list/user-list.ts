import { Component, OnInit, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/auth.model';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  private authService = inject(AuthService);

  // Signals
  onlineUsers = signal<UserProfile[]>([]);
  currentUser = this.authService.currentUser;
  isLoading = signal<boolean>(false);

  // Output events
  userSelected = output<UserProfile>();

  async ngOnInit(): Promise<void> {
    await this.loadOnlineUsers();
    
    // Refresh online users every 30 seconds
    setInterval(() => this.loadOnlineUsers(), 30000);
  }

  /**
   * Load online users from the server.
   */
  async loadOnlineUsers(): Promise<void> {
    this.isLoading.set(true);
    this.authService.getOnlineUsers().subscribe({
      next: (users) => {
        // Filter out current user from the list
        const filteredUsers = users.filter(
          (user) => user.id !== this.currentUser()?.id
        );
        this.onlineUsers.set(filteredUsers);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load online users:', error);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Handle user selection.
   */
  selectUser(user: UserProfile): void {
    this.userSelected.emit(user);
  }

  /**
   * Get user initials for avatar.
   */
  getUserInitials(user: UserProfile): string {
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  }
}
