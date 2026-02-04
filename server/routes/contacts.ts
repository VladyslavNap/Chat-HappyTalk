import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { CosmosService } from '../services/cosmos.service.js';
import { SignalRService } from '../services/signalr.service.js';
import { AuthService } from '../services/auth.service.js';
import {
  Contact,
  AddContactRequest,
  UpdateContactRequest,
  ContactListResponse,
  UserSearchResult,
} from '../models/contact.js';

/**
 * Register contacts API routes.
 * Handles contact management, user search, and online/offline status.
 */
export async function registerContactsRoutes(
  fastify: FastifyInstance,
  cosmosService: CosmosService,
  signalrService: SignalRService,
  authService: AuthService
): Promise<void> {
  // Middleware to extract and validate user from token
  const authenticateUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'No token provided' });
      return null;
    }

    const token = authHeader.substring(7);
    const user = await authService.getUserByToken(token);
    if (!user) {
      reply.status(401).send({ error: 'Invalid token' });
      return null;
    }

    return user;
  };

  // Get all contacts for the current user
  fastify.get(
    '/api/contacts',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Querystring: { includeOffline?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const includeOffline = request.query.includeOffline === 'true';
        const contacts = await cosmosService.getContacts(user.id, includeOffline);

        return reply.send(contacts);
      } catch (error) {
        fastify.log.error(error, 'Failed to get contacts');
        return reply.status(500).send({ error: 'Failed to get contacts' });
      }
    }
  );

  // Search for users to add as contacts
  fastify.get(
    '/api/contacts/search',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Querystring: { query: string; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { query } = request.query;
        if (!query || query.trim().length === 0) {
          return reply.status(400).send({ error: 'Search query is required' });
        }

        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
        const results = await cosmosService.searchUsers(user.id, query, limit);

        return reply.send(results);
      } catch (error) {
        fastify.log.error(error, 'Failed to search users');
        return reply.status(500).send({ error: 'Failed to search users' });
      }
    }
  );

  // Add a new contact
  fastify.post(
    '/api/contacts',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Body: AddContactRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { contactUserId, nickname } = request.body;

        if (!contactUserId) {
          return reply.status(400).send({ error: 'contactUserId is required' });
        }

        // Verify the contact user exists
        const contactUser = await cosmosService.getUserById(contactUserId);
        if (!contactUser) {
          return reply.status(404).send({ error: 'User not found' });
        }

        // Check if contact already exists
        const existingContact = await cosmosService.getContactByUserIds(user.id, contactUserId);
        if (existingContact) {
          return reply.status(409).send({ error: 'Contact already exists' });
        }

        // Create the contact
        const contact: Contact = {
          id: randomUUID(),
          userId: user.id,
          contactUserId,
          contactDisplayName: contactUser.displayName,
          contactAvatarUrl: contactUser.avatarUrl,
          contactStatus: contactUser.status || 'offline',
          addedAt: new Date().toISOString(),
          nickname,
        };

        await cosmosService.createContact(contact);

        // Broadcast contact added event
        await signalrService.broadcastContactAdded(user.id, contact);

        return reply.status(201).send(contact);
      } catch (error) {
        fastify.log.error(error, 'Failed to add contact');
        return reply.status(500).send({ error: 'Failed to add contact' });
      }
    }
  );

  // Update a contact (nickname, favorite status)
  fastify.patch(
    '/api/contacts/:contactId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { contactId: string };
        Body: UpdateContactRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { contactId } = request.params;
        const updates = request.body;

        const contact = await cosmosService.getContactById(contactId);
        if (!contact) {
          return reply.status(404).send({ error: 'Contact not found' });
        }

        if (contact.userId !== user.id) {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const updatedContact = await cosmosService.updateContact(contactId, user.id, updates);
        return reply.send(updatedContact);
      } catch (error) {
        fastify.log.error(error, 'Failed to update contact');
        return reply.status(500).send({ error: 'Failed to update contact' });
      }
    }
  );

  // Remove a contact
  fastify.delete(
    '/api/contacts/:contactId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { contactId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { contactId } = request.params;

        const contact = await cosmosService.getContactById(contactId);
        if (!contact) {
          return reply.status(404).send({ error: 'Contact not found' });
        }

        if (contact.userId !== user.id) {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        await cosmosService.deleteContact(contactId, user.id);

        // Broadcast contact removed event
        await signalrService.broadcastContactRemoved(user.id, contactId);

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to remove contact');
        return reply.status(500).send({ error: 'Failed to remove contact' });
      }
    }
  );

  // Get online status for specific contacts
  fastify.post(
    '/api/contacts/status',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Body: { contactIds: string[] };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { contactIds } = request.body;

        if (!Array.isArray(contactIds)) {
          return reply.status(400).send({ error: 'contactIds must be an array' });
        }

        const statuses = await cosmosService.getContactsStatus(contactIds);
        return reply.send(statuses);
      } catch (error) {
        fastify.log.error(error, 'Failed to get contact status');
        return reply.status(500).send({ error: 'Failed to get contact status' });
      }
    }
  );
}
