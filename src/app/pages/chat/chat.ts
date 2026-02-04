import { Component, OnInit, OnDestroy, signal, computed, inject, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SignalRService, ChatMessage } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { UserList } from '../../components/user-list/user-list';
import { RoomList } from '../../components/room-list/room-list';
import { CreateGroupComponent } from '../../components/create-group/create-group.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { UserProfile } from '../../models/auth.model';
import { createDMRoomId } from '../../models/dm.model';
import { Room } from '../../models/room.model';

interface DisplayMessage {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName?: string;
  isEdited?: boolean;
  editedAt?: string;
}

type ChatView = 'room' | 'dm';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, UserList, RoomList, CreateGroupComponent, ConfirmationDialogComponent],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy {
  private signalrService = inject(SignalRService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private createGroupComponent = viewChild<CreateGroupComponent>('createGroup');

  // User identity from auth service
  currentUser = this.authService.currentUser;

  // UI state
  newMessage = '';
  isConnecting = signal<boolean>(false);
  showSidebar = signal<boolean>(this.getInitialSidebarState());
  private shouldAutoScroll = true;

  // Admin message editing state
  editingMessageId = signal<string | null>(null);
  editingMessageText = signal('');
  isSavingEdit = signal(false);
  isDeletingMessage = signal(false);
  
  // Confirmation dialog state
  showDeleteConfirmation = signal<boolean>(false);
  messageToDelete = signal<DisplayMessage | null>(null);
  // Store the original ChatMessage to avoid repeated searches
  chatMessageToDelete = signal<ChatMessage | null>(null);
  
  // Computed message for confirmation dialog
  // Note: Newlines are preserved in the confirmation dialog component's white-space CSS
  deleteConfirmationMessage = computed(() => {
    const msg = this.messageToDelete();
    if (!msg) return '';
    return `Delete this message?\n\n"${msg.text}"\n\nThis action cannot be undone.`;
  });

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
   * Close sidebar on mobile after navigation.
   */
  closeSidebarOnMobile(): void {
    if (this.isMobile()) {
      this.showSidebar.set(false);
    }
  }

  /**
   * Open create group dialog.
   */
  openCreateGroupDialog(): void {
    const component = this.createGroupComponent();
    if (component) {
      component.open();
    }
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
      id: msg.id,
      text: msg.text,
      sender: isCurrentUser ? 'user' : 'other',
      timestamp: new Date(msg.createdAt),
      senderName: isCurrentUser ? undefined : msg.senderName,
      isEdited: msg.isEdited,
      editedAt: msg.editedAt,
    };
  }

  // ==================== Admin Message Controls ====================

  /**
   * Check if current user is super admin.
   */
  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  /**
   * Start editing a message (admin only).
   */
  startEditMessage(message: DisplayMessage): void {
    if (!this.isSuperAdmin) {
      return;
    }

    // Get the original ChatMessage to access roomid
    const chatMessage = this.signalrService.messages().find(m => m.id === message.id);
    if (!chatMessage) {
      return;
    }

    this.editingMessageId.set(message.id);
    this.editingMessageText.set(message.text);
  }

  /**
   * Save edited message (admin only).
   */
  async saveEditMessage(message: DisplayMessage): Promise<void> {
    if (!this.isSuperAdmin || !this.editingMessageId()) {
      return;
    }

    const newText = this.editingMessageText().trim();
    if (!newText) {
      this.notificationService.error('Message text cannot be empty');
      return;
    }

    // Get the original ChatMessage to access roomid
    const chatMessage = this.signalrService.messages().find(m => m.id === message.id);
    if (!chatMessage) {
      return;
    }

    this.isSavingEdit.set(true);

    try {
      const response = await this.http.patch<ChatMessage>(
        `/api/messages/${message.id}`,
        {
          text: newText,
          roomid: chatMessage.roomid
        }
      ).toPromise();

      if (response) {
        // Update message in local state
        this.signalrService.handleMessageEdited(response);
        this.cancelEditMessage();
        console.log('Message edited successfully');
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      this.notificationService.error('Failed to edit message. Please try again.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  /**
   * Cancel editing message.
   */
  cancelEditMessage(): void {
    this.editingMessageId.set(null);
    this.editingMessageText.set('');
  }

  /**
   * Delete a message (admin only).
   */
  deleteMessage(message: DisplayMessage): void {
    if (!this.isSuperAdmin) {
      return;
    }

    // Get the original ChatMessage to access roomid and store it to avoid repeated searches
    const chatMessage = this.signalrService.messages().find(m => m.id === message.id);
    if (!chatMessage) {
      return;
    }

    // Show confirmation dialog and store both messages
    this.messageToDelete.set(message);
    this.chatMessageToDelete.set(chatMessage);
    this.showDeleteConfirmation.set(true);
  }

  /**
   * Confirm and execute message deletion.
   */
  async confirmDeleteMessage(): Promise<void> {
    const message = this.messageToDelete();
    const chatMessage = this.chatMessageToDelete();
    
    if (!message || !chatMessage) {
      return;
    }

    this.isDeletingMessage.set(true);
    this.showDeleteConfirmation.set(false);

    try {
      await this.http.delete(
        `/api/messages/${message.id}?roomid=${encodeURIComponent(chatMessage.roomid)}`
      ).toPromise();

      // Remove message from local state
      this.signalrService.handleMessageDeleted(message.id);
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Failed to delete message:', error);
      this.notificationService.error('Failed to delete message. Please try again.');
    } finally {
      this.isDeletingMessage.set(false);
      this.messageToDelete.set(null);
      this.chatMessageToDelete.set(null);
    }
  }

  /**
   * Cancel message deletion.
   */
  cancelDeleteMessage(): void {
    this.showDeleteConfirmation.set(false);
    this.messageToDelete.set(null);
    this.chatMessageToDelete.set(null);
  }

  /**
   * Check if a specific message is being edited.
   */
  isEditingMessage(messageId: string): boolean {
    return this.editingMessageId() === messageId;
  }

  /**
   * Handle keyboard events for message editing.
   */
  onEditKeydown(event: KeyboardEvent, message: DisplayMessage): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.saveEditMessage(message);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditMessage();
    }
  }
}
