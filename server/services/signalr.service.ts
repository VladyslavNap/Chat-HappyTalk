import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { ChatMessage } from '../models/message.js';

/**
 * Azure SignalR/Web PubSub service for real-time chat.
 * Handles negotiate tokens and message broadcast.
 */
export class SignalRService {
  private serviceClient: WebPubSubServiceClient;
  private hubName: string;

  constructor() {
    const connectionString = process.env.AZURE_SIGNALR_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_SIGNALR_CONNECTION_STRING environment variable is required');
    }

    this.hubName = process.env.SIGNALR_HUB_NAME || 'chat';
    this.serviceClient = new WebPubSubServiceClient(connectionString, this.hubName);
  }

  /**
   * Generate a client access token for WebSocket connection.
   * For public chat, no user ID is required.
   */
  async negotiate(userId?: string): Promise<{ url: string }> {
    const options = userId
      ? { userId, roles: ['webpubsub.joinLeaveGroup', 'webpubsub.sendToGroup'] }
      : { roles: ['webpubsub.joinLeaveGroup', 'webpubsub.sendToGroup'] };

    const token = await this.serviceClient.getClientAccessToken(options);
    return { url: token.url };
  }

  /**
   * Broadcast a message to all clients in a group (room).
   */
  async broadcastToRoom(roomId: string, message: ChatMessage): Promise<void> {
    await this.serviceClient.group(roomId).sendToAll({
      type: 'message',
      data: message,
    });
  }

  /**
   * Broadcast a message to all connected clients.
   */
  async broadcastToAll(message: ChatMessage): Promise<void> {
    await this.serviceClient.sendToAll({
      type: 'message',
      data: message,
    });
  }

  /**
   * Add a connection to a group (room).
   */
  async addToGroup(connectionId: string, roomId: string): Promise<void> {
    await this.serviceClient.group(roomId).addConnection(connectionId);
  }

  /**
   * Remove a connection from a group (room).
   */
  async removeFromGroup(connectionId: string, roomId: string): Promise<void> {
    await this.serviceClient.group(roomId).removeConnection(connectionId);
  }
}
