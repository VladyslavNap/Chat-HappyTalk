import { CosmosClient, Container, Database } from '@azure/cosmos';
import { ChatMessage, MessageListResponse } from '../models/message.js';
import { User } from '../models/user.js';
import { Room } from '../models/room.js';

/**
 * Cosmos DB SQL repository for chat message persistence, user management, and room management.
 * Uses roomid as partition key for messages, and id as partition key for users and rooms.
 */
export class CosmosService {
  private client: CosmosClient;
  private database!: Database;
  private container!: Container;
  private userContainer!: Container;
  private roomContainer!: Container;
  private initialized = false;

  constructor() {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;

    if (!endpoint || !key) {
      throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
    }

    this.client = new CosmosClient({ endpoint, key });
  }

  /**
   * Initialize database and container (creates if not exists).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const databaseName = process.env.COSMOS_DATABASE_NAME || 'khRequest';
    const containerName = process.env.COSMOS_CONTAINER_NAME || 'chat_messages';
    const userContainerName = 'users';
    const roomContainerName = 'rooms';

    // Create database if not exists
    const { database } = await this.client.databases.createIfNotExists({
      id: databaseName,
    });
    this.database = database;

    // Create container with roomid as partition key
    const { container } = await this.database.containers.createIfNotExists({
      id: containerName,
      partitionKey: { paths: ['/roomid'] },
      defaultTtl: process.env.CHAT_TTL_SECONDS ? parseInt(process.env.CHAT_TTL_SECONDS, 10) : -1,
    });
    this.container = container;

    // Create user container with id as partition key
    const { container: userContainer } = await this.database.containers.createIfNotExists({
      id: userContainerName,
      partitionKey: { paths: ['/id'] },
    });
    this.userContainer = userContainer;

    // Create room container with id as partition key
    const { container: roomContainer } = await this.database.containers.createIfNotExists({
      id: roomContainerName,
      partitionKey: { paths: ['/id'] },
    });
    this.roomContainer = roomContainer;

    this.initialized = true;
    console.log(`Cosmos DB initialized: ${databaseName}/${containerName}, ${userContainerName}, ${roomContainerName}`);
  }

  /**
   * Save a chat message to Cosmos DB.
   */
  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    await this.initialize();
    const { resource } = await this.container.items.create(message);
    return resource as ChatMessage;
  }

  /**
   * Get messages for a room, ordered by createdAt descending.
   * Supports pagination via continuation token.
   */
  async getMessages(
    roomid: string,
    limit: number = 50,
    continuationToken?: string
  ): Promise<MessageListResponse> {
    await this.initialize();

    const querySpec = {
      query:
        'SELECT * FROM c WHERE c.roomid = @roomid ORDER BY c.createdAt DESC',
      parameters: [{ name: '@roomid', value: roomid }],
    };

    const { resources, continuationToken: nextToken } = await this.container.items
      .query(querySpec, {
        maxItemCount: limit,
        continuationToken,
        partitionKey: roomid,
      })
      .fetchNext();

    return {
      messages: (resources as ChatMessage[]).reverse(), // Return in chronological order
      continuationToken: nextToken,
    };
  }

  /**
   * Get a single message by ID and roomid.
   */
  async getMessage(id: string, roomid: string): Promise<ChatMessage | null> {
    await this.initialize();
    try {
      const { resource } = await this.container.item(id, roomid).read<ChatMessage>();
      return resource || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new user.
   */
  async createUser(user: User): Promise<User> {
    await this.initialize();
    const { resource } = await this.userContainer.items.create(user);
    return resource as User;
  }

  /**
   * Get a user by ID.
   */
  async getUserById(id: string): Promise<User | null> {
    await this.initialize();
    try {
      const { resource } = await this.userContainer.item(id, id).read<User>();
      return resource || null;
    } catch {
      return null;
    }
  }

  /**
   * Get a user by username.
   */
  async getUserByUsername(username: string): Promise<User | null> {
    await this.initialize();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.username = @username',
      parameters: [{ name: '@username', value: username.toLowerCase() }],
    };

    const { resources } = await this.userContainer.items.query(querySpec).fetchAll();
    return resources.length > 0 ? (resources[0] as User) : null;
  }

  /**
   * Get a user by email.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email.toLowerCase() }],
    };

    const { resources } = await this.userContainer.items.query(querySpec).fetchAll();
    return resources.length > 0 ? (resources[0] as User) : null;
  }

  /**
   * Update user's last login timestamp.
   */
  async updateUserLastLogin(userId: string): Promise<void> {
    await this.initialize();
    try {
      const user = await this.getUserById(userId);
      if (user) {
        user.lastLoginAt = new Date().toISOString();
        await this.userContainer.item(userId, userId).replace(user);
      }
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Update user's status.
   */
  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    await this.initialize();
    try {
      const user = await this.getUserById(userId);
      if (user) {
        user.status = status;
        await this.userContainer.item(userId, userId).replace(user);
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }

  /**
   * Get all online users.
   */
  async getOnlineUsers(): Promise<User[]> {
    await this.initialize();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.status = @status',
      parameters: [{ name: '@status', value: 'online' }],
    };

    const { resources } = await this.userContainer.items.query(querySpec).fetchAll();
    return resources as User[];
  }

  /**
   * Get DM conversations for a user.
   * Returns rooms where the user has sent or received messages.
   */
  async getDMConversations(userId: string): Promise<any[]> {
    await this.initialize();

    // Query for all messages in DM rooms that involve this user
    const querySpec = {
      query: `
        SELECT c.roomid, MAX(c.createdAt) as lastMessageTime
        FROM c 
        WHERE STARTSWITH(c.roomid, 'dm-')
        AND (CONTAINS(c.roomid, @userId))
        GROUP BY c.roomid
        ORDER BY MAX(c.createdAt) DESC
      `,
      parameters: [{ name: '@userId', value: userId }],
    };

    try {
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Failed to get DM conversations:', error);
      return [];
    }
  }

  /**
   * Create a new room.
   */
  async createRoom(room: Room): Promise<Room> {
    await this.initialize();
    const { resource } = await this.roomContainer.items.create(room);
    return resource as Room;
  }

  /**
   * Get a room by ID.
   */
  async getRoomById(id: string): Promise<Room | null> {
    await this.initialize();
    try {
      const { resource } = await this.roomContainer.item(id, id).read<Room>();
      return resource || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all active rooms.
   */
  async getAllRooms(includeInactive: boolean = false): Promise<Room[]> {
    await this.initialize();

    const querySpec = includeInactive
      ? { query: 'SELECT * FROM c ORDER BY c.createdAt DESC' }
      : {
          query: 'SELECT * FROM c WHERE c.isActive = @isActive ORDER BY c.createdAt DESC',
          parameters: [{ name: '@isActive', value: true }],
        };

    const { resources } = await this.roomContainer.items.query(querySpec).fetchAll();
    return resources as Room[];
  }

  /**
   * Get public rooms.
   */
  async getPublicRooms(): Promise<Room[]> {
    await this.initialize();

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.isActive = @isActive ORDER BY c.createdAt DESC',
      parameters: [
        { name: '@type', value: 'public' },
        { name: '@isActive', value: true },
      ],
    };

    const { resources } = await this.roomContainer.items.query(querySpec).fetchAll();
    return resources as Room[];
  }

  /**
   * Update a room.
   */
  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | null> {
    await this.initialize();
    try {
      const room = await this.getRoomById(roomId);
      if (!room) {
        return null;
      }

      const updatedRoom = {
        ...room,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await this.roomContainer.item(roomId, roomId).replace(updatedRoom);
      return resource as Room;
    } catch (error) {
      console.error('Failed to update room:', error);
      return null;
    }
  }

  /**
   * Delete a room (soft delete by setting isActive to false).
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    await this.initialize();
    try {
      const room = await this.getRoomById(roomId);
      if (!room) {
        return false;
      }

      room.isActive = false;
      room.updatedAt = new Date().toISOString();

      await this.roomContainer.item(roomId, roomId).replace(room);
      return true;
    } catch (error) {
      console.error('Failed to delete room:', error);
      return false;
    }
  }
}
