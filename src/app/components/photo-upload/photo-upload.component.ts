import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../services/upload.service';

export type UploadType = 'avatar' | 'group';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-upload.component.html',
  styleUrl: './photo-upload.component.scss'
})
export class PhotoUploadComponent {
  @Input() uploadType: UploadType = 'avatar';
  @Input() groupId?: string;
  @Input() currentPhotoUrl?: string;
  @Output() uploadComplete = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();
  
  previewUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  isDragging = signal(false);
  errorMessage = signal<string | null>(null);
  
  constructor(private uploadService: UploadService) {}
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }
  
  private handleFile(file: File): void {
    this.errorMessage.set(null);
    
    // Validate file
    const validation = this.uploadService.validateImageFile(file);
    if (!validation.valid) {
      this.errorMessage.set(validation.error || 'Invalid file');
      this.uploadError.emit(validation.error);
      return;
    }
    
    this.selectedFile.set(file);
    
    // Create preview
    this.uploadService.createPreviewUrl(file).then(url => {
      this.previewUrl.set(url);
    }).catch(err => {
      console.error('Failed to create preview:', err);
      this.errorMessage.set('Failed to create preview');
    });
  }
  
  uploadPhoto(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    
    this.isUploading.set(true);
    this.errorMessage.set(null);
    
    let uploadObservable;
    
    if (this.uploadType === 'avatar') {
      uploadObservable = this.uploadService.uploadAvatar(file);
    } else if (this.uploadType === 'group' && this.groupId) {
      uploadObservable = this.uploadService.uploadGroupPhoto(this.groupId, file);
    } else {
      this.errorMessage.set('Invalid upload configuration');
      this.isUploading.set(false);
      return;
    }
    
    uploadObservable.subscribe({
      next: (response) => {
        const photoUrl = this.uploadType === 'avatar' ? response.avatarUrl : (response as any).photoUrl;
        console.log('Upload successful:', photoUrl);
        this.uploadComplete.emit(photoUrl);
        this.reset();
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Upload failed:', err);
        const errorMsg = err.error?.error || 'Upload failed';
        this.errorMessage.set(errorMsg);
        this.uploadError.emit(errorMsg);
        this.isUploading.set(false);
      }
    });
  }
  
  deletePhoto(): void {
    if (!confirm('Delete current photo?')) {
      return;
    }
    
    this.isUploading.set(true);
    this.errorMessage.set(null);
    
    if (this.uploadType === 'avatar') {
      this.uploadService.deleteAvatar().subscribe({
        next: () => {
          console.log('Photo deleted');
          this.uploadComplete.emit('');
          this.reset();
          this.isUploading.set(false);
        },
        error: (err) => {
          console.error('Delete failed:', err);
          const errorMsg = err.error?.error || 'Delete failed';
          this.errorMessage.set(errorMsg);
          this.uploadError.emit(errorMsg);
          this.isUploading.set(false);
        }
      });
    } else {
      this.errorMessage.set('Cannot delete group photo from this component');
      this.isUploading.set(false);
    }
  }
  
  reset(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
  }
  
  triggerFileInput(): void {
    document.getElementById('file-input')?.click();
  }
}
