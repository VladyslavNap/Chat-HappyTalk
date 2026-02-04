import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Confirmation dialog component.
 * Provides an accessible replacement for browser confirm() dialogs.
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  title = input<string>('Confirm Action');
  message = input.required<string>();
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');
  confirmButtonClass = input<string>('danger');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
