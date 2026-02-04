import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { CosmosService } from '../services/cosmos.service.js';
import { SignalRService } from '../services/signalr.service.js';
import { AuthService } from '../services/auth.service.js';
import {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddGroupMembersRequest,
  createGroupRoomId,
} from '../models/group.js';
import { Room } from '../models/room.js';

/**
 * Register groups API routes.
 * Handles private group creation, member management, and group metadata.
 */
export async function registerGroupsRoutes(
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

  // Get all groups for the current user
  fastify.get(
    '/api/groups',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const groups = await cosmosService.getUserGroups(user.id);
        return reply.send(groups);
      } catch (error) {
        fastify.log.error(error, 'Failed to get groups');
        return reply.status(500).send({ error: 'Failed to get groups' });
      }
    }
  );

  // Get group details with member information
  fastify.get(
    '/api/groups/:groupId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { groupId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { groupId } = request.params;
        const group = await cosmosService.getGroupById(groupId);

        if (!group) {
          return reply.status(404).send({ error: 'Group not found' });
        }

        // Check if user is a member
        if (!group.members.includes(user.id)) {
          return reply.status(403).send({ error: 'Not a member of this group' });
        }

        // Get member details
        const groupDetails = await cosmosService.getGroupDetails(groupId);
        return reply.send(groupDetails);
      } catch (error) {
        fastify.log.error(error, 'Failed to get group details');
        return reply.status(500).send({ error: 'Failed to get group details' });
      }
    }
  );

  // Create a new private group
  fastify.post(
    '/api/groups',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Body: CreateGroupRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { name, description, memberIds } = request.body;

        if (!name || name.trim().length === 0) {
          return reply.status(400).send({ error: 'Group name is required' });
        }

        if (!memberIds || memberIds.length === 0) {
          return reply.status(400).send({ error: 'At least one member is required' });
        }

        // Verify all member users exist
        const memberUsers = await Promise.all(
          memberIds.map((id) => cosmosService.getUserById(id))
        );

        if (memberUsers.some((u) => !u)) {
          return reply.status(400).send({ error: 'One or more member users not found' });
        }

        const groupId = randomUUID();
        const roomId = createGroupRoomId(groupId);
        const now = new Date().toISOString();

        // Create the group
        const group: Group = {
          id: groupId,
          name: name.trim(),
          description: description?.trim(),
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
          members: [user.id, ...memberIds],
          admins: [user.id],
          isActive: true,
          type: 'private',
          roomId,
        };

        await cosmosService.createGroup(group);

        // Create associated room for messages
        const room: Room = {
          id: roomId,
          name: name.trim(),
          description: description?.trim(),
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
          type: 'private',
          members: group.members,
          isActive: true,
        };

        await cosmosService.createRoom(room);

        // Broadcast group created event to all members
        await signalrService.broadcastGroupCreated(group);

        return reply.status(201).send(group);
      } catch (error) {
        fastify.log.error(error, 'Failed to create group');
        return reply.status(500).send({ error: 'Failed to create group' });
      }
    }
  );

  // Update group metadata (name, description, avatar)
  fastify.patch(
    '/api/groups/:groupId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { groupId: string };
        Body: UpdateGroupRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { groupId } = request.params;
        const updates = request.body;

        const group = await cosmosService.getGroupById(groupId);
        if (!group) {
          return reply.status(404).send({ error: 'Group not found' });
        }

        // Check if user is an admin
        if (!group.admins.includes(user.id)) {
          return reply.status(403).send({ error: 'Only group admins can update group' });
        }

        const updatedGroup = await cosmosService.updateGroup(groupId, updates);

        // Update associated room name if name changed
        if (updates.name) {
          await cosmosService.updateRoom(group.roomId, { name: updates.name });
        }

        // Broadcast group updated event
        await signalrService.broadcastGroupUpdated(updatedGroup);

        return reply.send(updatedGroup);
      } catch (error) {
        fastify.log.error(error, 'Failed to update group');
        return reply.status(500).send({ error: 'Failed to update group' });
      }
    }
  );

  // Add members to a group
  fastify.post(
    '/api/groups/:groupId/members',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { groupId: string };
        Body: AddGroupMembersRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { groupId } = request.params;
        const { memberIds } = request.body;

        if (!memberIds || memberIds.length === 0) {
          return reply.status(400).send({ error: 'memberIds are required' });
        }

        const group = await cosmosService.getGroupById(groupId);
        if (!group) {
          return reply.status(404).send({ error: 'Group not found' });
        }

        // Check if user is an admin
        if (!group.admins.includes(user.id)) {
          return reply.status(403).send({ error: 'Only group admins can add members' });
        }

        // Verify all member users exist
        const memberUsers = await Promise.all(
          memberIds.map((id) => cosmosService.getUserById(id))
        );

        if (memberUsers.some((u) => !u)) {
          return reply.status(400).send({ error: 'One or more member users not found' });
        }

        // Filter out users who are already members
        const newMembers = memberIds.filter((id) => !group.members.includes(id));

        if (newMembers.length === 0) {
          return reply.status(400).send({ error: 'All users are already members' });
        }

        const updatedGroup = await cosmosService.addGroupMembers(groupId, newMembers);

        // Update room members
        await cosmosService.updateRoom(group.roomId, { members: updatedGroup.members });

        // Broadcast members added event
        await signalrService.broadcastGroupMembersAdded(updatedGroup, newMembers);

        return reply.send(updatedGroup);
      } catch (error) {
        fastify.log.error(error, 'Failed to add group members');
        return reply.status(500).send({ error: 'Failed to add group members' });
      }
    }
  );

  // Remove a member from a group
  fastify.delete(
    '/api/groups/:groupId/members/:memberId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { groupId: string; memberId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { groupId, memberId } = request.params;

        const group = await cosmosService.getGroupById(groupId);
        if (!group) {
          return reply.status(404).send({ error: 'Group not found' });
        }

        // Check if user is an admin or removing themselves
        if (!group.admins.includes(user.id) && user.id !== memberId) {
          return reply
            .status(403)
            .send({ error: 'Only group admins can remove other members' });
        }

        // Don't allow removing the last admin
        if (group.admins.includes(memberId) && group.admins.length === 1) {
          return reply.status(400).send({ error: 'Cannot remove the last admin' });
        }

        const updatedGroup = await cosmosService.removeGroupMember(groupId, memberId);

        // Update room members
        await cosmosService.updateRoom(group.roomId, { members: updatedGroup.members });

        // Broadcast member removed event
        await signalrService.broadcastGroupMemberRemoved(updatedGroup, memberId);

        return reply.send(updatedGroup);
      } catch (error) {
        fastify.log.error(error, 'Failed to remove group member');
        return reply.status(500).send({ error: 'Failed to remove group member' });
      }
    }
  );

  // Delete a group (admin only)
  fastify.delete(
    '/api/groups/:groupId',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
        Params: { groupId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        const { groupId } = request.params;

        const group = await cosmosService.getGroupById(groupId);
        if (!group) {
          return reply.status(404).send({ error: 'Group not found' });
        }

        // Only creator can delete the group
        if (group.createdBy !== user.id) {
          return reply.status(403).send({ error: 'Only the group creator can delete the group' });
        }

        // Mark as inactive instead of deleting
        await cosmosService.updateGroup(groupId, { isActive: false });
        await cosmosService.updateRoom(group.roomId, { isActive: false });

        // Broadcast group deleted event
        await signalrService.broadcastGroupDeleted(groupId, group.members);

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete group');
        return reply.status(500).send({ error: 'Failed to delete group' });
      }
    }
  );
}
