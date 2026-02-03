/**
 * Message model for chat persistence and SignalR broadcast.
 * Stored in Cosmos DB SQL with roomid as partition key.
 */
export interface ChatMessage {
  /** Unique message ID (GUID) */
  id: string;
  /** Room/channel identifier - partition key */
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
}

export interface SendMessageRequest {
  text: string;
  senderName: string;
  senderId?: string;
  roomid?: string;
  clientId?: string;
}

export interface MessageListResponse {
  messages: ChatMessage[];
  continuationToken?: string;
}
