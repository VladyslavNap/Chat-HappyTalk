import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

/**
 * Service for displaying notifications to the user.
 * Provides a better UX than browser alert() dialogs.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications = signal<Notification[]>([]);

  /**
   * Show an error notification.
   */
  error(message: string): void {
    this.show(message, 'error');
  }

  /**
   * Show a success notification.
   */
  success(message: string): void {
    this.show(message, 'success');
  }

  /**
   * Show an info notification.
   */
  info(message: string): void {
    this.show(message, 'info');
  }

  /**
   * Show a warning notification.
   */
  warning(message: string): void {
    this.show(message, 'warning');
  }

  /**
   * Show a notification.
   */
  private show(message: string, type: Notification['type']): void {
    const id = Math.random().toString(36).substring(7);
    const notification: Notification = { id, message, type };
    
    this.notifications.update(notifications => [...notifications, notification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.dismiss(id);
    }, 5000);
  }

  /**
   * Dismiss a notification.
   */
  dismiss(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }
}
