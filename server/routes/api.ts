import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { CosmosService } from '../services/cosmos.service.js';
import { SignalRService } from '../services/signalr.service.js';
import { AuthService } from '../services/auth.service.js';
import { ChatMessage, SendMessageRequest } from '../models/message.js';
import { RegisterUserRequest, LoginRequest } from '../models/user.js';
import { CreateRoomRequest, UpdateRoomRequest, Room, createRoomId } from '../models/room.js';

/**
 * Register API routes for chat functionality and authentication.
 */
export async function registerApiRoutes(
  fastify: FastifyInstance,
  cosmosService: CosmosService,
  signalrService: SignalRService,
  authService: AuthService
): Promise<void> {
  // Health check endpoint
  fastify.get('/api/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==================== Authentication Endpoints ====================

  // Register a new user
  fastify.post(
    '/api/auth/register',
    async (request: FastifyRequest<{ Body: RegisterUserRequest }>, reply: FastifyReply) => {
      try {
        const result = await authService.register(request.body);
        if (result.success) {
          return reply.status(201).send(result);
        } else {
          return reply.status(400).send(result);
        }
      } catch (error) {
        fastify.log.error(error, 'Registration failed');
        return reply.status(500).send({ success: false, error: 'Registration failed' });
      }
    }
  );

  // Login
  fastify.post(
    '/api/auth/login',
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      try {
        const result = await authService.login(request.body);
        if (result.success) {
          return reply.send(result);
        } else {
          return reply.status(401).send(result);
        }
      } catch (error) {
        fastify.log.error(error, 'Login failed');
        return reply.status(500).send({ success: false, error: 'Login failed' });
      }
    }
  );

  // Logout
  fastify.post(
    '/api/auth/logout',
    async (
      request: FastifyRequest<{ Headers: { authorization?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ success: false, error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const success = await authService.logout(token);
        return reply.send({ success });
      } catch (error) {
        fastify.log.error(error, 'Logout failed');
        return reply.status(500).send({ success: false, error: 'Logout failed' });
      }
    }
  );

  // Get current user profile
  fastify.get(
    '/api/auth/me',
    async (
      request: FastifyRequest<{ Headers: { authorization?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const user = await authService.getUserByToken(token);
        if (user) {
          return reply.send(user);
        } else {
          return reply.status(401).send({ error: 'Invalid token' });
        }
      } catch (error) {
        fastify.log.error(error, 'Get user failed');
        return reply.status(500).send({ error: 'Failed to get user' });
      }
    }
  );

  // Get online users
  fastify.get(
    '/api/users/online',
    async (
      request: FastifyRequest<{ Headers: { authorization?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const users = await authService.getOnlineUsers();
        return reply.send(users);
      } catch (error) {
        fastify.log.error(error, 'Get online users failed');
        return reply.status(500).send({ error: 'Failed to get online users' });
      }
    }
  );

  // ==================== Chat Endpoints ====================

  // SignalR negotiate endpoint - the SignalR client calls /api/chat/negotiate automatically
  fastify.post(
    '/api/chat/negotiate',
    async (
      request: FastifyRequest<{ Querystring: { userId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.query;
        const result = await signalrService.negotiate(userId);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error, 'Negotiate failed');
        return reply.status(500).send({ error: 'Failed to negotiate connection' });
      }
    }
  );

  // Also support GET for negotiate (some clients use GET)
  fastify.get(
    '/api/chat/negotiate',
    async (
      request: FastifyRequest<{ Querystring: { userId?: string; negotiateVersion?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.query;
        const result = await signalrService.negotiate(userId);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error, 'Negotiate failed');
        return reply.status(500).send({ error: 'Failed to negotiate connection' });
      }
    }
  );

  // Get messages for a room
  fastify.get(
    '/api/messages/:roomid',
    async (
      request: FastifyRequest<{
        Params: { roomid: string };
        Querystring: { limit?: string; continuationToken?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { roomid } = request.params;
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
        const { continuationToken } = request.query;

        const result = await cosmosService.getMessages(roomid, limit, continuationToken);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error, 'Failed to get messages');
        return reply.status(500).send({ error: 'Failed to get messages' });
      }
    }
  );

  // Send a new message
  fastify.post(
    '/api/messages',
    async (request: FastifyRequest<{ Body: SendMessageRequest }>, reply: FastifyReply) => {
      try {
        const { text, senderName, senderId, roomid = 'public', clientId } = request.body;

        if (!text || !text.trim()) {
          return reply.status(400).send({ error: 'Message text is required' });
        }

        if (!senderName || !senderName.trim()) {
          return reply.status(400).send({ error: 'Sender name is required' });
        }

        const message: ChatMessage = {
          id: randomUUID(),
          roomid,
          text: text.trim(),
          senderName: senderName.trim(),
          senderId,
          createdAt: new Date().toISOString(),
          clientId,
        };

        // Persist to Cosmos DB
        const savedMessage = await cosmosService.saveMessage(message);

        // Broadcast via SignalR
        await signalrService.broadcastToRoom(roomid, savedMessage);

        return reply.status(201).send(savedMessage);
      } catch (error) {
        fastify.log.error(error, 'Failed to send message');
        return reply.status(500).send({ error: 'Failed to send message' });
      }
    }
  );

  // Join a room (for SignalR group membership tracking)
  fastify.post(
    '/api/rooms/:roomid/join',
    async (
      request: FastifyRequest<{
        Params: { roomid: string };
        Body: { connectionId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { roomid } = request.params;
        const { connectionId } = request.body;

        if (!connectionId) {
          return reply.status(400).send({ error: 'Connection ID is required' });
        }

        await signalrService.addToGroup(connectionId, roomid);
        return reply.send({ success: true, roomid });
      } catch (error) {
        fastify.log.error(error, 'Failed to join room');
        return reply.status(500).send({ error: 'Failed to join room' });
      }
    }
  );

  // Leave a room
  fastify.post(
    '/api/rooms/:roomid/leave',
    async (
      request: FastifyRequest<{
        Params: { roomid: string };
        Body: { connectionId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { roomid } = request.params;
        const { connectionId } = request.body;

        if (!connectionId) {
          return reply.status(400).send({ error: 'Connection ID is required' });
        }

        await signalrService.removeFromGroup(connectionId, roomid);
        return reply.send({ success: true, roomid });
      } catch (error) {
        fastify.log.error(error, 'Failed to leave room');
        return reply.status(500).send({ error: 'Failed to leave room' });
      }
    }
  );

  // ==================== Direct Message Endpoints ====================

  // Create or get DM room between two users
  fastify.post(
    '/api/dm/room',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Body: { targetUserId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const { targetUserId } = request.body;
        if (!targetUserId) {
          return reply.status(400).send({ error: 'Target user ID is required' });
        }

        // Create room ID (always sorted to ensure consistency)
        const sortedIds = [authToken.userId, targetUserId].sort();
        const roomId = `dm-${sortedIds[0]}-${sortedIds[1]}`;

        return reply.send({ roomId, userId1: authToken.userId, userId2: targetUserId });
      } catch (error) {
        fastify.log.error(error, 'Failed to create DM room');
        return reply.status(500).send({ error: 'Failed to create DM room' });
      }
    }
  );

  // Get DM conversations for current user
  fastify.get(
    '/api/dm/conversations',
    async (
      request: FastifyRequest<{ Headers: { authorization?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        // Get all DM rooms for this user
        const conversations = await cosmosService.getDMConversations(authToken.userId);
        return reply.send(conversations);
      } catch (error) {
        fastify.log.error(error, 'Failed to get DM conversations');
        return reply.status(500).send({ error: 'Failed to get DM conversations' });
      }
    }
  );

  // ==================== Room Management Endpoints ====================

  // Create a new room
  fastify.post(
    '/api/rooms',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Body: CreateRoomRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const { name, description, type = 'public' } = request.body;

        if (!name || !name.trim()) {
          return reply.status(400).send({ error: 'Room name is required' });
        }

        // Create room ID from name
        const roomId = createRoomId(name);

        // Check if room already exists
        const existingRoom = await cosmosService.getRoomById(roomId);
        if (existingRoom) {
          return reply.status(409).send({ error: 'Room with this name already exists' });
        }

        // Create new room
        const room: Room = {
          id: roomId,
          name: name.trim(),
          description: description?.trim(),
          createdBy: authToken.userId,
          createdAt: new Date().toISOString(),
          type,
          isActive: true,
          members: type === 'private' ? [authToken.userId] : undefined,
        };

        const createdRoom = await cosmosService.createRoom(room);
        return reply.status(201).send(createdRoom);
      } catch (error) {
        fastify.log.error(error, 'Failed to create room');
        return reply.status(500).send({ error: 'Failed to create room' });
      }
    }
  );

  // Get all rooms
  fastify.get(
    '/api/rooms',
    async (
      request: FastifyRequest<{ Headers: { authorization?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const rooms = await cosmosService.getPublicRooms();
        return reply.send({ rooms });
      } catch (error) {
        fastify.log.error(error, 'Failed to get rooms');
        return reply.status(500).send({ error: 'Failed to get rooms' });
      }
    }
  );

  // Get a specific room
  fastify.get(
    '/api/rooms/:roomId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { roomId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const { roomId } = request.params;
        const room = await cosmosService.getRoomById(roomId);

        if (!room) {
          return reply.status(404).send({ error: 'Room not found' });
        }

        return reply.send(room);
      } catch (error) {
        fastify.log.error(error, 'Failed to get room');
        return reply.status(500).send({ error: 'Failed to get room' });
      }
    }
  );

  // Update a room (rename, change description)
  fastify.put(
    '/api/rooms/:roomId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { roomId: string };
        Body: UpdateRoomRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const { roomId } = request.params;
        const room = await cosmosService.getRoomById(roomId);

        if (!room) {
          return reply.status(404).send({ error: 'Room not found' });
        }

        // Check if user is the creator or has permission
        if (room.createdBy !== authToken.userId) {
          return reply.status(403).send({ error: 'Not authorized to update this room' });
        }

        const updates = request.body;
        const updatedRoom = await cosmosService.updateRoom(roomId, updates);

        if (!updatedRoom) {
          return reply.status(500).send({ error: 'Failed to update room' });
        }

        return reply.send(updatedRoom);
      } catch (error) {
        fastify.log.error(error, 'Failed to update room');
        return reply.status(500).send({ error: 'Failed to update room' });
      }
    }
  );

  // Delete a room
  fastify.delete(
    '/api/rooms/:roomId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { roomId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const authToken = authService.validateToken(token);
        if (!authToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const { roomId } = request.params;
        const room = await cosmosService.getRoomById(roomId);

        if (!room) {
          return reply.status(404).send({ error: 'Room not found' });
        }

        // Check if user is the creator
        if (room.createdBy !== authToken.userId) {
          return reply.status(403).send({ error: 'Not authorized to delete this room' });
        }

        // Prevent deletion of public room
        if (roomId === 'public') {
          return reply.status(403).send({ error: 'Cannot delete the public room' });
        }

        const success = await cosmosService.deleteRoom(roomId);

        if (!success) {
          return reply.status(500).send({ error: 'Failed to delete room' });
        }

        return reply.send({ success: true, message: 'Room deleted successfully' });
      } catch (error) {
        fastify.log.error(error, 'Failed to delete room');
        return reply.status(500).send({ error: 'Failed to delete room' });
      }
    }
  );
}
