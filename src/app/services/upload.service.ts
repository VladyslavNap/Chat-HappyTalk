import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service for uploading photos (avatars, group photos).
 * Handles file uploads to Azure Blob Storage via backend API.
 */
@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Upload user avatar.
   * @param file - Image file to upload
   * @returns Observable with avatar URL
   */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const url = `${this.apiUrl}/upload/avatar`;
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ avatarUrl: string }>(url, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Upload group photo.
   * @param groupId - Group ID
   * @param file - Image file to upload
   * @returns Observable with photo URL
   */
  uploadGroupPhoto(groupId: string, file: File): Observable<{ photoUrl: string }> {
    const url = `${this.apiUrl}/upload/group/${groupId}/photo`;
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ photoUrl: string }>(url, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Delete user avatar.
   */
  deleteAvatar(): Observable<void> {
    const url = `${this.apiUrl}/upload/avatar`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Validate file before upload.
   * @param file - File to validate
   * @returns Validation result with error message if invalid
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      };
    }

    // Check file size (5MB max)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: 'File size must be less than 5MB.',
      };
    }

    return { valid: true };
  }

  /**
   * Create a preview URL for an image file.
   * @param file - Image file
   * @returns Promise with data URL
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }
}
