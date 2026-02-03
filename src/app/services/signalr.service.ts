import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  WebPubSubClient,
  OnGroupDataMessageArgs,
  OnServerDataMessageArgs,
} from '@azure/web-pubsub-client';

export interface ChatMessage {
  id: string;
  roomid: string;
  text: string;
  senderName: string;
  senderId?: string;
  createdAt: string;
  clientId?: string;
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

/**
 * SignalR/Web PubSub service for real-time chat functionality.
 * Handles connection management, message sending, and receiving.
 */
@Injectable({
  providedIn: 'root',
})
export class SignalRService implements OnDestroy {
  private client: WebPubSubClient | null = null;
  private currentroomid = signal<string>('public');

  // Reactive state
  readonly connected = signal<boolean>(false);
  readonly connectionError = signal<string | null>(null);
  readonly messages = signal<ChatMessage[]>([]);

  // Computed signals
  readonly messageCount = computed(() => this.messages().length);

  constructor(private http: HttpClient) {}

  /**
   * Connect to the SignalR/Web PubSub service.
   */
  async connect(roomid: string = 'public', userId?: string): Promise<void> {
    if (this.client) {
      await this.disconnect();
    }

    this.currentroomid.set(roomid);
    this.connectionError.set(null);

    try {
      // Get connection URL from backend negotiate endpoint
      const negotiateUrl = userId
        ? `/api/negotiate?userId=${encodeURIComponent(userId)}`
        : '/api/negotiate';

      const response = await this.http.post<{ url: string }>(negotiateUrl, {}).toPromise();

      if (!response?.url) {
        throw new Error('Failed to get connection URL');
      }

      // Create Web PubSub client
      this.client = new WebPubSubClient(response.url);

      // Set up event handlers
      this.client.on('connected', () => {
        console.log('SignalR connected');
        this.connected.set(true);
        this.connectionError.set(null);
        // Join the room group
        this.client?.joinGroup(roomid);
      });

      this.client.on('disconnected', () => {
        console.log('SignalR disconnected');
        this.connected.set(false);
      });

      this.client.on('group-message', (e: OnGroupDataMessageArgs) => {
        const data = e.message.data as { type?: string; data?: ChatMessage } | undefined;
        if (data?.type === 'message' && data.data) {
          this.addMessage(data.data);
        }
      });

      this.client.on('server-message', (e: OnServerDataMessageArgs) => {
        const data = e.message.data as { type?: string; data?: ChatMessage } | undefined;
        if (data?.type === 'message' && data.data) {
          this.addMessage(data.data);
        }
      });

      // Start the connection
      await this.client.start();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.connectionError.set(errorMessage);
      console.error('SignalR connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the SignalR service.
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.stop();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.client = null;
      this.connected.set(false);
    }
  }

  /**
   * Send a message via the backend API.
   * The backend will persist to Cosmos DB and broadcast via SignalR.
   */
  async sendMessage(text: string, senderName: string, senderId?: string): Promise<ChatMessage> {
    const request: SendMessageRequest = {
      text,
      senderName,
      senderId,
      roomid: this.currentroomid(),
      clientId: crypto.randomUUID(),
    };

    const response = await this.http.post<ChatMessage>('/api/messages', request).toPromise();

    if (!response) {
      throw new Error('Failed to send message');
    }

    return response;
  }

  /**
   * Load message history from the backend.
   */
  async loadHistory(roomid?: string, limit?: number): Promise<ChatMessage[]> {
    const room = roomid || this.currentroomid();
    const url = limit ? `/api/messages/${room}?limit=${limit}` : `/api/messages/${room}`;

    const response = await this.http.get<MessageListResponse>(url).toPromise();

    if (response?.messages) {
      this.messages.set(response.messages);
      return response.messages;
    }

    return [];
  }

  /**
   * Clear local message history.
   */
  clearMessages(): void {
    this.messages.set([]);
  }

  /**
   * Add a message to the local state (for real-time updates).
   */
  private addMessage(message: ChatMessage): void {
    // Avoid duplicates based on id or clientId
    const existing = this.messages();
    const isDuplicate = existing.some(
      (m: ChatMessage) => m.id === message.id || (message.clientId && m.clientId === message.clientId)
    );

    if (!isDuplicate) {
      this.messages.update((msgs: ChatMessage[]) => [...msgs, message]);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
