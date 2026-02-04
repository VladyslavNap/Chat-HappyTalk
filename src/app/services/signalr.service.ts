import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ChatMessage {
  id: string;
  roomid: string;
  text: string;
  senderName: string;
  senderId?: string;
  createdAt: string;
  editedAt?: string;
  isEdited?: boolean;
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
 * Chat service for real-time messaging.
 * Works with Azure SignalR Service in Serverless mode using polling.
 */
@Injectable({
  providedIn: 'root',
})
export class SignalRService implements OnDestroy {
  private currentroomid = signal<string>('public');
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private knownMessageIds = new Set<string>();

  // Reactive state
  readonly connected = signal<boolean>(false);
  readonly connectionError = signal<string | null>(null);
  readonly messages = signal<ChatMessage[]>([]);

  // Computed signals
  readonly messageCount = computed(() => this.messages().length);

  constructor(private http: HttpClient) {}

  /**
   * Connect to the chat service.
   * Uses polling to fetch new messages every 2 seconds.
   */
  async connect(roomid: string = 'public', _userId?: string): Promise<void> {
    await this.disconnect();

    this.currentroomid.set(roomid);
    this.connectionError.set(null);

    try {
      console.log('Connecting to chat service (Serverless mode with polling)...');

      // Start polling for new messages
      this.startPolling();
      this.connected.set(true);
      console.log('Chat service connected');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.connectionError.set(errorMessage);
      console.error('Chat connection error:', error);
      throw error;
    }
  }

  /**
   * Start polling for new messages.
   */
  private startPolling(): void {
    // Poll every 2 seconds for new messages
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollMessages();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  }

  /**
   * Poll for new messages from the server.
   */
  private async pollMessages(): Promise<void> {
    const room = this.currentroomid();
    const response = await this.http.get<MessageListResponse>(`/api/messages/${room}?limit=50`).toPromise();

    if (response?.messages) {
      const currentMessages = this.messages();

      // Find new messages that we haven't seen yet
      const newMessages = response.messages.filter(m => !this.knownMessageIds.has(m.id));

      if (newMessages.length > 0) {
        // Add new message IDs to known set
        newMessages.forEach(m => this.knownMessageIds.add(m.id));

        // Merge and sort by createdAt
        const allMessages = [...currentMessages, ...newMessages];
        allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.messages.set(allMessages);

        console.log(`Received ${newMessages.length} new message(s)`);
      }
    }
  }

  /**
   * Disconnect from the chat service.
   */
  async disconnect(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.connected.set(false);
    this.knownMessageIds.clear();
  }

  /**
   * Send a message via the backend API.
   * The backend will persist to Cosmos DB and broadcast via SignalR REST API.
   */
  async sendMessage(text: string, senderName: string, senderId?: string, roomid?: string): Promise<ChatMessage> {
    const request: SendMessageRequest = {
      text,
      senderName,
      senderId,
      roomid: roomid || this.currentroomid(),
      clientId: crypto.randomUUID(),
    };

    const response = await this.http.post<ChatMessage>('/api/messages', request).toPromise();

    if (!response) {
      throw new Error('Failed to send message');
    }

    // Add the sent message immediately to local state and known IDs
    this.addMessage(response);
    this.knownMessageIds.add(response.id);

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
      // Add all loaded message IDs to known set
      response.messages.forEach(m => this.knownMessageIds.add(m.id));
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
    this.knownMessageIds.clear();
  }

  /**
   * Add a message to the local state.
   */
  private addMessage(message: ChatMessage): void {
    const existing = this.messages();
    const isDuplicate = existing.some(
      (m: ChatMessage) => m.id === message.id || (message.clientId && m.clientId === message.clientId)
    );

    if (!isDuplicate) {
      this.messages.update((msgs: ChatMessage[]) => [...msgs, message]);
    }
  }

  // ==================== Real-time Event Handlers ====================
  // These methods would be called by a real SignalR connection
  // For now, they are prepared for when WebSocket support is added

  /**
   * Handle message edited event (called when admin edits a message).
   */
  handleMessageEdited(editedMessage: ChatMessage): void {
    this.messages.update((msgs) => 
      msgs.map((m) => (m.id === editedMessage.id ? editedMessage : m))
    );
  }

  /**
   * Handle message deleted event (called when admin deletes a message).
   */
  handleMessageDeleted(messageId: string): void {
    this.messages.update((msgs) => msgs.filter((m) => m.id !== messageId));
    this.knownMessageIds.delete(messageId);
  }

  /**
   * Handle user online event.
   * This would update contact status in a real implementation.
   */
  handleUserOnline(data: { userId: string; userProfile: any }): void {
    console.log('User came online:', data.userId);
    // ContactsService will handle this via its own event handler
  }

  /**
   * Handle user offline event.
   * This would update contact status in a real implementation.
   */
  handleUserOffline(data: { userId: string }): void {
    console.log('User went offline:', data.userId);
    // ContactsService will handle this via its own event handler
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
