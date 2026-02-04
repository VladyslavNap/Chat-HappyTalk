import { CosmosClient, Container, Database } from '@azure/cosmos';
import { ChatMessage, MessageListResponse } from '../models/message.js';
import { User } from '../models/user.js';
import { Room } from '../models/room.js';
import { Contact, UserSearchResult } from '../models/contact.js';
import { Group, GroupDetails, GroupMember } from '../models/group.js';

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
  private contactContainer!: Container;
  private groupContainer!: Container;
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
    const contactContainerName = 'contacts';
    const groupContainerName = 'groups';

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

    // Create contact container with userId as partition key
    const { container: contactContainer } = await this.database.containers.createIfNotExists({
      id: contactContainerName,
      partitionKey: { paths: ['/userId'] },
    });
    this.contactContainer = contactContainer;

    // Create group container with id as partition key
    const { container: groupContainer } = await this.database.containers.createIfNotExists({
      id: groupContainerName,
      partitionKey: { paths: ['/id'] },
    });
    this.groupContainer = groupContainer;

    this.initialized = true;
    console.log(`Cosmos DB initialized: ${databaseName}/${containerName}, ${userContainerName}, ${roomContainerName}, ${contactContainerName}, ${groupContainerName}`);
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

  // ==================== Contact Management Methods ====================

  /**
   * Get all contacts for a user.
   */
  async getContacts(userId: string, includeOffline: boolean = true): Promise<Contact[]> {
    await this.initialize();
    try {
      let query = `SELECT * FROM c WHERE c.userId = @userId`;
      if (!includeOffline) {
        query += ` AND c.contactStatus = 'online'`;
      }
      query += ` ORDER BY c.addedAt DESC`;

      const { resources } = await this.contactContainer.items
        .query({
          query,
          parameters: [{ name: '@userId', value: userId }],
        })
        .fetchAll();

      return resources as Contact[];
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return [];
    }
  }

  /**
   * Search users by username, display name, or email.
   */
  async searchUsers(currentUserId: string, query: string, limit: number = 20): Promise<UserSearchResult[]> {
    await this.initialize();
    try {
      const searchQuery = `
        SELECT TOP @limit c.id, c.username, c.displayName, c.email, c.avatarUrl, c.status
        FROM c
        WHERE c.id != @userId
        AND (
          CONTAINS(LOWER(c.username), LOWER(@query))
          OR CONTAINS(LOWER(c.displayName), LOWER(@query))
          OR CONTAINS(LOWER(c.email), LOWER(@query))
        )
        ORDER BY c.displayName
      `;

      const { resources } = await this.userContainer.items
        .query({
          query: searchQuery,
          parameters: [
            { name: '@userId', value: currentUserId },
            { name: '@query', value: query },
            { name: '@limit', value: limit },
          ],
        })
        .fetchAll();

      // Check if each user is already a contact
      const results: UserSearchResult[] = [];
      for (const user of resources as User[]) {
        const existingContact = await this.getContactByUserIds(currentUserId, user.id);
        results.push({
          ...user,
          isContact: !!existingContact,
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Create a new contact.
   */
  async createContact(contact: Contact): Promise<Contact> {
    await this.initialize();
    const { resource } = await this.contactContainer.items.create(contact);
    return resource as Contact;
  }

  /**
   * Get contact by contact ID.
   */
  async getContactById(contactId: string): Promise<Contact | null> {
    await this.initialize();
    try {
      const { resources } = await this.contactContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @contactId',
          parameters: [{ name: '@contactId', value: contactId }],
        })
        .fetchAll();

      return resources.length > 0 ? (resources[0] as Contact) : null;
    } catch (error) {
      console.error('Failed to get contact by ID:', error);
      return null;
    }
  }

  /**
   * Get contact relationship between two users.
   */
  async getContactByUserIds(userId: string, contactUserId: string): Promise<Contact | null> {
    await this.initialize();
    try {
      const { resources } = await this.contactContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.userId = @userId AND c.contactUserId = @contactUserId',
          parameters: [
            { name: '@userId', value: userId },
            { name: '@contactUserId', value: contactUserId },
          ],
        })
        .fetchAll();

      return resources.length > 0 ? (resources[0] as Contact) : null;
    } catch (error) {
      console.error('Failed to get contact by user IDs:', error);
      return null;
    }
  }

  /**
   * Update a contact.
   */
  async updateContact(contactId: string, userId: string, updates: Partial<Contact>): Promise<Contact | null> {
    await this.initialize();
    try {
      const contact = await this.getContactById(contactId);
      if (!contact) {
        return null;
      }

      const updatedContact = {
        ...contact,
        ...updates,
      };

      const { resource } = await this.contactContainer.item(contactId, userId).replace(updatedContact);
      return resource as Contact;
    } catch (error) {
      console.error('Failed to update contact:', error);
      return null;
    }
  }

  /**
   * Delete a contact.
   */
  async deleteContact(contactId: string, userId: string): Promise<void> {
    await this.initialize();
    await this.contactContainer.item(contactId, userId).delete();
  }

  /**
   * Get online status for multiple contacts.
   */
  async getContactsStatus(contactIds: string[]): Promise<{ [userId: string]: { status: string; lastSeenAt?: string } }> {
    await this.initialize();
    try {
      if (contactIds.length === 0) {
        return {};
      }

      const placeholders = contactIds.map((_, i) => `@id${i}`).join(',');
      const parameters = contactIds.map((id, i) => ({ name: `@id${i}`, value: id }));

      const { resources } = await this.userContainer.items
        .query({
          query: `SELECT c.id, c.status, c.lastSeenAt FROM c WHERE c.id IN (${placeholders})`,
          parameters,
        })
        .fetchAll();

      const statuses: { [userId: string]: { status: string; lastSeenAt?: string } } = {};
      for (const user of resources as User[]) {
        statuses[user.id] = {
          status: user.status || 'offline',
          lastSeenAt: user.lastSeenAt,
        };
      }

      return statuses;
    } catch (error) {
      console.error('Failed to get contacts status:', error);
      return {};
    }
  }

  // ==================== Group Management Methods ====================

  /**
   * Create a new group.
   */
  async createGroup(group: Group): Promise<Group> {
    await this.initialize();
    const { resource } = await this.groupContainer.items.create(group);
    return resource as Group;
  }

  /**
   * Get group by ID.
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    await this.initialize();
    try {
      const { resource } = await this.groupContainer.item(groupId, groupId).read();
      return resource as Group;
    } catch (error) {
      console.error('Failed to get group:', error);
      return null;
    }
  }

  /**
   * Get all groups for a user.
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    await this.initialize();
    try {
      const { resources } = await this.groupContainer.items
        .query({
          query: `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, @userId) AND c.isActive = true ORDER BY c.updatedAt DESC`,
          parameters: [{ name: '@userId', value: userId }],
        })
        .fetchAll();

      return resources as Group[];
    } catch (error) {
      console.error('Failed to get user groups:', error);
      return [];
    }
  }

  /**
   * Get group details with member information.
   */
  async getGroupDetails(groupId: string): Promise<GroupDetails | null> {
    await this.initialize();
    try {
      const group = await this.getGroupById(groupId);
      if (!group) {
        return null;
      }

      // Get member details
      const memberDetails: GroupMember[] = [];
      for (const memberId of group.members) {
        const user = await this.getUserById(memberId);
        if (user) {
          memberDetails.push({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            status: user.status,
            isAdmin: group.admins.includes(memberId),
            joinedAt: group.createdAt, // TODO: Track individual join times
          });
        }
      }

      return {
        ...group,
        memberDetails,
      };
    } catch (error) {
      console.error('Failed to get group details:', error);
      return null;
    }
  }

  /**
   * Update a group.
   */
  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    await this.initialize();
    const group = await this.getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const updatedGroup = {
      ...group,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.groupContainer.item(groupId, groupId).replace(updatedGroup);
    return resource as Group;
  }

  /**
   * Add members to a group.
   */
  async addGroupMembers(groupId: string, memberIds: string[]): Promise<Group> {
    await this.initialize();
    const group = await this.getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const updatedMembers = [...new Set([...group.members, ...memberIds])];
    return this.updateGroup(groupId, { members: updatedMembers });
  }

  /**
   * Remove a member from a group.
   */
  async removeGroupMember(groupId: string, memberId: string): Promise<Group> {
    await this.initialize();
    const group = await this.getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const updatedMembers = group.members.filter((id) => id !== memberId);
    const updatedAdmins = group.admins.filter((id) => id !== memberId);

    return this.updateGroup(groupId, { members: updatedMembers, admins: updatedAdmins });
  }

  // ==================== Additional User Methods ====================

  /**
   * Update user avatar URL.
   */
  async updateUserAvatar(userId: string, avatarUrl?: string): Promise<void> {
    await this.initialize();
    try {
      const user = await this.getUserById(userId);
      if (user) {
        user.avatarUrl = avatarUrl;
        await this.userContainer.item(userId, userId).replace(user);
      }
    } catch (error) {
      console.error('Failed to update user avatar:', error);
    }
  }

  /**
   * Update user last seen timestamp.
   */
  async updateUserLastSeen(userId: string, timestamp: string): Promise<void> {
    await this.initialize();
    try {
      const user = await this.getUserById(userId);
      if (user) {
        user.lastSeenAt = timestamp;
        await this.userContainer.item(userId, userId).replace(user);
      }
    } catch (error) {
      console.error('Failed to update user last seen:', error);
    }
  }

  // ==================== Message Admin Methods ====================

  /**
   * Get a message by ID.
   */
  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    await this.initialize();
    try {
      const { resources } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @messageId',
          parameters: [{ name: '@messageId', value: messageId }],
        })
        .fetchAll();

      return resources.length > 0 ? (resources[0] as ChatMessage) : null;
    } catch (error) {
      console.error('Failed to get message by ID:', error);
      return null;
    }
  }

  /**
   * Update a message (for admin editing).
   */
  async updateMessage(message: ChatMessage): Promise<void> {
    await this.initialize();
    await this.container.item(message.id, message.roomid).replace(message);
  }

  /**
   * Delete a message (for admin deletion).
   */
  async deleteMessage(messageId: string, roomid: string): Promise<void> {
    await this.initialize();
    await this.container.item(messageId, roomid).delete();
  }
}
