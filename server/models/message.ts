/**
 * Message model for chat persistence and SignalR broadcast.
 * Stored in Cosmos DB SQL with roomid as partition key.
 * Supports both public rooms and direct messages (DM).
 * 
 * DM Room Naming Convention:
 * For direct messages, roomid is constructed as: dm-{smallerUserId}-{largerUserId}
 * This ensures consistent room names regardless of who initiates the conversation.
 */
export interface ChatMessage {
  /** Unique message ID (GUID) */
  id: string;
  /** Room/channel identifier - partition key. For DMs: dm-{userId1}-{userId2} */
  roomid: string;
  /** Message text content */
  text: string;
  /** Sender display name */
  senderName: string;
  /** Optional sender ID for tracking */
  senderId?: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** Client-generated ID for deduplication */
  clientId?: string;
  /** TTL in seconds (optional, for retention policy) */
  ttl?: number;
  /** Type of message: 'public' or 'dm' */
  type?: 'public' | 'dm';
  /** For DMs: recipient user ID */
  recipientId?: string;
}

export interface SendMessageRequest {
  text: string;
  senderName: string;
  senderId?: string;
  roomid?: string;
  clientId?: string;
  type?: 'public' | 'dm';
  recipientId?: string;
}

export interface MessageListResponse {
  messages: ChatMessage[];
  continuationToken?: string;
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
