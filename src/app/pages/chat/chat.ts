import { Component, OnInit, OnDestroy, signal, computed, inject, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, ChatMessage } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { UserList } from '../../components/user-list/user-list';
import { RoomList } from '../../components/room-list/room-list';
import { UserProfile } from '../../models/auth.model';
import { createDMRoomId } from '../../models/dm.model';
import { Room } from '../../models/room.model';

interface DisplayMessage {
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName?: string;
}

type ChatView = 'room' | 'dm';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, UserList, RoomList],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy {
  private signalrService = inject(SignalRService);
  private authService = inject(AuthService);
  private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  // User identity from auth service
  currentUser = this.authService.currentUser;

  // UI state
  newMessage = '';
  isConnecting = signal<boolean>(false);
  showSidebar = signal<boolean>(this.getInitialSidebarState());
  private shouldAutoScroll = true;

  // Chat view state
  currentView = signal<ChatView>('room');
  currentDMUser = signal<UserProfile | null>(null);
  currentRoom = signal<Room | null>(null);
  currentRoomId = signal<string>('public');

  // Computed messages for display
  messages = computed<DisplayMessage[]>(() => {
    const chatMessages = this.signalrService.messages();
    return chatMessages.map((msg) => this.toDisplayMessage(msg));
  });

  // Connection state
  connected = this.signalrService.connected;
  connectionError = this.signalrService.connectionError;

  constructor() {
    // Auto-scroll when new messages arrive
    effect(() => {
      const messageCount = this.messages().length;
      if (messageCount > 0 && this.shouldAutoScroll) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Handle window resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        // Auto-hide sidebar on mobile, auto-show on desktop
        if (!localStorage.getItem('happytalk_sidebar_visible')) {
          this.showSidebar.set(window.innerWidth > 768);
        }
      });
    }
  }

  async ngOnInit(): Promise<void> {
    // Set initial room to public
    this.currentRoom.set({
      id: 'public',
      name: 'Public',
      description: 'Main public chat room',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      type: 'public',
      isActive: true,
    });
    await this.connectToChat();
  }

  ngOnDestroy(): void {
    this.signalrService.disconnect();
  }

  async connectToChat(): Promise<void> {
    this.isConnecting.set(true);
    try {
      const user = this.currentUser();
      if (user) {
        await this.signalrService.connect('public', user.id);
        await this.signalrService.loadHistory('public', 50);
        // Scroll to bottom after loading history
        this.scrollToBottom(false);
        setTimeout(() => this.scrollToBottom(false), 100);
        setTimeout(() => this.scrollToBottom(false), 300);
      }
    } catch (error) {
      console.error('Failed to connect to chat:', error);
    } finally {
      this.isConnecting.set(false);
    }
  }

  /**
   * Handle room selection from room list.
   */
  async onRoomSelected(room: Room): Promise<void> {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    this.currentView.set('room');
    this.currentRoom.set(room);
    this.currentDMUser.set(null);
    this.currentRoomId.set(room.id);

    // Disconnect and reconnect to selected room
    await this.signalrService.disconnect();
    this.isConnecting.set(true);
    try {
      await this.signalrService.connect(room.id, currentUser.id);
      await this.signalrService.loadHistory(room.id, 50);
      this.scrollToBottom(false);
      setTimeout(() => this.scrollToBottom(false), 100);
    } catch (error) {
      console.error('Failed to connect to room:', error);
    } finally {
      this.isConnecting.set(false);
    }
  }

  /**
   * Handle user selection from user list (start DM).
   */
  async onUserSelected(user: UserProfile): Promise<void> {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    this.currentView.set('dm');
    this.currentDMUser.set(user);
    this.currentRoom.set(null);

    // Create DM room ID
    const roomId = createDMRoomId(currentUser.id, user.id);
    this.currentRoomId.set(roomId);

    // Disconnect and reconnect to DM room
    await this.signalrService.disconnect();
    this.isConnecting.set(true);
    try {
      await this.signalrService.connect(roomId, currentUser.id);
      await this.signalrService.loadHistory(roomId, 50);
      this.scrollToBottom(false);
      setTimeout(() => this.scrollToBottom(false), 100);
    } catch (error) {
      console.error('Failed to connect to DM room:', error);
    } finally {
      this.isConnecting.set(false);
    }
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() && this.connected()) {
      const messageText = this.newMessage.trim();
      this.newMessage = '';

      // Ensure auto-scroll for sent messages
      this.shouldAutoScroll = true;

      const user = this.currentUser();
      if (!user) return;

      try {
        await this.signalrService.sendMessage(
          messageText,
          user.displayName,
          user.id,
          this.currentRoomId()
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        // Restore the message if sending failed
        this.newMessage = messageText;
      }
    }
  }

  /**
   * Handle logout.
   */
  onLogout(): void {
    this.authService.logout().subscribe();
  }

  /**
   * Toggle sidebar visibility.
   */
  toggleSidebar(): void {
    this.showSidebar.set(!this.showSidebar());
    // Save preference to localStorage
    localStorage.setItem('happytalk_sidebar_visible', String(this.showSidebar()));
  }

  /**
   * Check if device is mobile.
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Get initial sidebar state based on screen size.
   */
  private getInitialSidebarState(): boolean {
    // Check localStorage first
    const saved = localStorage.getItem('happytalk_sidebar_visible');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default: show on desktop, hide on mobile
    return window.innerWidth > 768;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 150; // pixels from bottom
    const position = element.scrollHeight - element.scrollTop - element.clientHeight;

    // Enable auto-scroll only if user is near bottom
    this.shouldAutoScroll = position < threshold;
  }

  private scrollToBottom(smooth: boolean = true): void {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  private toDisplayMessage(msg: ChatMessage): DisplayMessage {
    const user = this.currentUser();
    const isCurrentUser = msg.senderId === user?.id;
    return {
      text: msg.text,
      sender: isCurrentUser ? 'user' : 'other',
      timestamp: new Date(msg.createdAt),
      senderName: isCurrentUser ? undefined : msg.senderName,
    };
  }
}
