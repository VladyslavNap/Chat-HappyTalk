/**
 * Room models and interfaces for the client-side application.
 */

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  type: 'public' | 'private' | 'dm';
  members?: string[];
  isActive: boolean;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  type?: 'public' | 'private';
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface RoomListResponse {
  rooms: Room[];
  continuationToken?: string;
}

/**
 * Convert room name to room ID (lowercase, replace spaces with dashes).
 */
export function createRoomId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a room ID is a DM room.
 */
export function isDMRoom(roomId: string): boolean {
  return roomId.startsWith('dm-');
}

/**
 * Check if a room ID is the public room.
 */
export function isPublicRoom(roomId: string): boolean {
  return roomId === 'public';
}
