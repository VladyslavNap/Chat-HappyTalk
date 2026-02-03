import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { CosmosService } from '../services/cosmos.service.js';
import { SignalRService } from '../services/signalr.service.js';
import { ChatMessage, SendMessageRequest } from '../models/message.js';

/**
 * Register API routes for chat functionality.
 */
export async function registerApiRoutes(
  fastify: FastifyInstance,
  cosmosService: CosmosService,
  signalrService: SignalRService
): Promise<void> {
  // Health check endpoint
  fastify.get('/api/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // SignalR negotiate endpoint - returns WebSocket URL with access token
  fastify.post(
    '/api/negotiate',
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
}
