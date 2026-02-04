import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PhotoUploadComponent } from '../../components/photo-upload/photo-upload.component';
import { UserProfile } from '../../models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PhotoUploadComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isEditingName = signal(false);
  newDisplayName = signal('');
  isSaving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.newDisplayName.set(user.displayName);
    }
  }

  startEditName(): void {
    const user = this.currentUser();
    if (user) {
      this.newDisplayName.set(user.displayName);
      this.isEditingName.set(true);
    }
  }

  cancelEditName(): void {
    this.isEditingName.set(false);
    this.errorMessage.set(null);
  }

  saveDisplayName(): void {
    const name = this.newDisplayName().trim();
    if (!name) {
      this.errorMessage.set('Display name cannot be empty');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // TODO: Implement update display name API call
    // For now, just simulate success
    setTimeout(() => {
      this.isSaving.set(false);
      this.isEditingName.set(false);
      this.successMessage.set('Display name updated successfully!');
      setTimeout(() => this.successMessage.set(null), 3000);
    }, 500);
  }

  onAvatarUploaded(avatarUrl: string): void {
    console.log('Avatar uploaded:', avatarUrl);
    this.successMessage.set('Avatar updated successfully!');
    setTimeout(() => this.successMessage.set(null), 3000);
    
    // Update user profile with new avatar URL
    const user = this.currentUser();
    if (user) {
      this.authService.updateCurrentUser({ ...user, avatarUrl });
    }
  }

  onUploadError(error: string): void {
    this.errorMessage.set(error);
    setTimeout(() => this.errorMessage.set(null), 5000);
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    return (user.displayName || user.username || 'U').substring(0, 2).toUpperCase();
  }
}
