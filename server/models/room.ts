/**
 * Room model for chat room management.
 * Stored in Cosmos DB SQL with id as partition key.
 */
export interface Room {
  /** Unique room ID (lowercase, no spaces) */
  id: string;
  /** Display name of the room */
  name: string;
  /** Description of the room (optional) */
  description?: string;
  /** User ID of the room creator */
  createdBy: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt?: string;
  /** Room type: 'public', 'private', or 'dm' */
  type: 'public' | 'private' | 'dm';
  /** List of user IDs who are members (for private rooms) */
  members?: string[];
  /** Whether the room is active */
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
