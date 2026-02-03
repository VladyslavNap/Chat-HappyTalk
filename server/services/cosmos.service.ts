import { CosmosClient, Container, Database } from '@azure/cosmos';
import { ChatMessage, MessageListResponse } from '../models/message.js';

/**
 * Cosmos DB SQL repository for chat message persistence.
 * Uses roomId as partition key for efficient queries.
 */
export class CosmosService {
  private client: CosmosClient;
  private database!: Database;
  private container!: Container;
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

    // Create database if not exists
    const { database } = await this.client.databases.createIfNotExists({
      id: databaseName,
    });
    this.database = database;

    // Create container with roomId as partition key
    const { container } = await this.database.containers.createIfNotExists({
      id: containerName,
      partitionKey: { paths: ['/roomId'] },
      defaultTtl: process.env.CHAT_TTL_SECONDS ? parseInt(process.env.CHAT_TTL_SECONDS, 10) : -1,
    });
    this.container = container;

    this.initialized = true;
    console.log(`Cosmos DB initialized: ${databaseName}/${containerName}`);
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
    roomId: string,
    limit: number = 50,
    continuationToken?: string
  ): Promise<MessageListResponse> {
    await this.initialize();

    const querySpec = {
      query:
        'SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@roomId', value: roomId }],
    };

    const { resources, continuationToken: nextToken } = await this.container.items
      .query(querySpec, {
        maxItemCount: limit,
        continuationToken,
        partitionKey: roomId,
      })
      .fetchNext();

    return {
      messages: (resources as ChatMessage[]).reverse(), // Return in chronological order
      continuationToken: nextToken,
    };
  }

  /**
   * Get a single message by ID and roomId.
   */
  async getMessage(id: string, roomId: string): Promise<ChatMessage | null> {
    await this.initialize();
    try {
      const { resource } = await this.container.item(id, roomId).read<ChatMessage>();
      return resource || null;
    } catch {
      return null;
    }
  }
}
