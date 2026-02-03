import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, ChatMessage } from '../../services/signalr.service';

interface DisplayMessage {
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName?: string;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy {
  private signalrService = inject(SignalRService);

  // User identity (generated or from storage)
  private userId = signal<string>(this.getOrCreateUserId());
  userName = signal<string>(this.getOrCreateUserName());

  // UI state
  newMessage = '';
  isConnecting = signal<boolean>(false);
  showNamePrompt = signal<boolean>(false);
  tempUserName = '';

  // Computed messages for display
  messages = computed<DisplayMessage[]>(() => {
    const chatMessages = this.signalrService.messages();
    return chatMessages.map((msg) => this.toDisplayMessage(msg));
  });

  // Connection state
  connected = this.signalrService.connected;
  connectionError = this.signalrService.connectionError;

  async ngOnInit(): Promise<void> {
    // Check if user has a name set
    if (!localStorage.getItem('happytalk_username')) {
      this.showNamePrompt.set(true);
    } else {
      await this.connectToChat();
    }
  }

  ngOnDestroy(): void {
    this.signalrService.disconnect();
  }

  async connectToChat(): Promise<void> {
    this.isConnecting.set(true);
    try {
      await this.signalrService.connect('public', this.userId());
      await this.signalrService.loadHistory('public', 50);
    } catch (error) {
      console.error('Failed to connect to chat:', error);
    } finally {
      this.isConnecting.set(false);
    }
  }

  async setUserName(): Promise<void> {
    if (this.tempUserName.trim()) {
      localStorage.setItem('happytalk_username', this.tempUserName.trim());
      this.userName.set(this.tempUserName.trim());
      this.showNamePrompt.set(false);
      await this.connectToChat();
    }
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() && this.connected()) {
      const messageText = this.newMessage;
      this.newMessage = '';

      try {
        await this.signalrService.sendMessage(
          messageText,
          this.userName(),
          this.userId()
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        // Restore the message if sending failed
        this.newMessage = messageText;
      }
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onNameKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.setUserName();
    }
  }

  private toDisplayMessage(msg: ChatMessage): DisplayMessage {
    const isCurrentUser = msg.senderId === this.userId();
    return {
      text: msg.text,
      sender: isCurrentUser ? 'user' : 'other',
      timestamp: new Date(msg.createdAt),
      senderName: isCurrentUser ? undefined : msg.senderName,
    };
  }

  private getOrCreateUserId(): string {
    let id = localStorage.getItem('happytalk_userid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('happytalk_userid', id);
    }
    return id;
  }

  private getOrCreateUserName(): string {
    return localStorage.getItem('happytalk_username') || '';
  }
}
