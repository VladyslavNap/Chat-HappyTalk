import { UserProfile } from './auth.model';

/**
 * Direct message conversation model.
 */
export interface DMConversation {
  /** The other user in the conversation */
  user: UserProfile;
  /** The room ID for this DM (dm-{userId1}-{userId2}) */
  roomId: string;
  /** Last message in the conversation */
  lastMessage?: string;
  /** Timestamp of last message */
  lastMessageTime?: Date;
  /** Number of unread messages */
  unreadCount?: number;
}

/**
 * Create a DM room ID from two user IDs.
 * Always returns the same room ID regardless of the order of user IDs.
 */
export function createDMRoomId(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();
  return `dm-${sortedIds[0]}-${sortedIds[1]}`;
}

/**
 * Check if a room ID is a DM room.
 */
export function isDMRoom(roomid: string): boolean {
  return roomid.startsWith('dm-');
}

/**
 * Extract user IDs from a DM room ID.
 */
export function extractUserIdsFromDMRoom(roomid: string): [string, string] | null {
  if (!isDMRoom(roomid)) {
    return null;
  }
  const parts = roomid.split('-');
  if (parts.length !== 3) {
    return null;
  }
  return [parts[1], parts[2]];
}
