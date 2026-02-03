import { Component, OnInit, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Room, CreateRoomRequest } from '../../models/room.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-room-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './room-list.html',
  styleUrl: './room-list.scss',
})
export class RoomList implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Signals
  rooms = signal<Room[]>([]);
  isLoading = signal<boolean>(false);
  showCreateDialog = signal<boolean>(false);
  showRenameDialog = signal<boolean>(false);
  selectedRoom = signal<Room | null>(null);

  // Form data
  newRoomName = '';
  newRoomDescription = '';
  renameRoomName = '';
  renameRoomDescription = '';

  // Output events
  roomSelected = output<Room>();

  async ngOnInit(): Promise<void> {
    await this.loadRooms();
  }

  /**
   * Get authorization headers.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Load rooms from the server.
   */
  async loadRooms(): Promise<void> {
    this.isLoading.set(true);
    const headers = this.getAuthHeaders();

    this.http.get<{ rooms: Room[] }>(`${environment.apiUrl}/api/rooms`, { headers }).subscribe({
      next: (response) => {
        // Add the public room if not already in the list
        const hasPublicRoom = response.rooms.some((r) => r.id === 'public');
        if (!hasPublicRoom) {
          response.rooms.unshift({
            id: 'public',
            name: 'Public',
            description: 'Main public chat room',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            type: 'public',
            isActive: true,
          });
        }
        this.rooms.set(response.rooms);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load rooms:', error);
        // Show public room even if API fails
        this.rooms.set([
          {
            id: 'public',
            name: 'Public',
            description: 'Main public chat room',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            type: 'public',
            isActive: true,
          },
        ]);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Open create room dialog.
   */
  openCreateDialog(): void {
    this.newRoomName = '';
    this.newRoomDescription = '';
    this.showCreateDialog.set(true);
  }

  /**
   * Close create room dialog.
   */
  closeCreateDialog(): void {
    this.showCreateDialog.set(false);
  }

  /**
   * Create a new room.
   */
  async createRoom(): Promise<void> {
    if (!this.newRoomName.trim()) {
      return;
    }

    const headers = this.getAuthHeaders();
    const request: CreateRoomRequest = {
      name: this.newRoomName.trim(),
      description: this.newRoomDescription.trim() || undefined,
      type: 'public',
    };

    this.http.post<Room>(`${environment.apiUrl}/api/rooms`, request, { headers }).subscribe({
      next: (room) => {
        this.rooms.update((rooms) => [...rooms, room]);
        this.closeCreateDialog();
        this.roomSelected.emit(room);
      },
      error: (error) => {
        console.error('Failed to create room:', error);
        alert(error.error?.error || 'Failed to create room');
      },
    });
  }

  /**
   * Open rename dialog for a room.
   */
  openRenameDialog(room: Room): void {
    this.selectedRoom.set(room);
    this.renameRoomName = room.name;
    this.renameRoomDescription = room.description || '';
    this.showRenameDialog.set(true);
  }

  /**
   * Close rename dialog.
   */
  closeRenameDialog(): void {
    this.showRenameDialog.set(false);
    this.selectedRoom.set(null);
  }

  /**
   * Rename a room.
   */
  async renameRoom(): Promise<void> {
    const room = this.selectedRoom();
    if (!room || !this.renameRoomName.trim()) {
      return;
    }

    const headers = this.getAuthHeaders();
    const updates = {
      name: this.renameRoomName.trim(),
      description: this.renameRoomDescription.trim() || undefined,
    };

    this.http
      .put<Room>(`${environment.apiUrl}/api/rooms/${room.id}`, updates, { headers })
      .subscribe({
        next: (updatedRoom) => {
          this.rooms.update((rooms) =>
            rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
          );
          this.closeRenameDialog();
        },
        error: (error) => {
          console.error('Failed to rename room:', error);
          alert(error.error?.error || 'Failed to rename room');
        },
      });
  }

  /**
   * Delete a room.
   */
  async deleteRoom(room: Room): Promise<void> {
    if (!confirm(`Are you sure you want to delete the room "${room.name}"?`)) {
      return;
    }

    const headers = this.getAuthHeaders();

    this.http.delete(`${environment.apiUrl}/api/rooms/${room.id}`, { headers }).subscribe({
      next: () => {
        this.rooms.update((rooms) => rooms.filter((r) => r.id !== room.id));
      },
      error: (error) => {
        console.error('Failed to delete room:', error);
        alert(error.error?.error || 'Failed to delete room');
      },
    });
  }

  /**
   * Select a room.
   */
  selectRoom(room: Room): void {
    this.roomSelected.emit(room);
  }

  /**
   * Check if current user can manage a room.
   */
  canManageRoom(room: Room): boolean {
    const currentUser = this.authService.currentUser();
    return room.createdBy === currentUser?.id && room.id !== 'public';
  }
}
