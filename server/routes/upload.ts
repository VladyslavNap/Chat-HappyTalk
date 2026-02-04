import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BlobStorageService } from '../services/blob-storage.service.js';
import { CosmosService } from '../services/cosmos.service.js';
import { SignalRService } from '../services/signalr.service.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Register upload API routes for avatars and group photos.
 */
export async function registerUploadRoutes(
  fastify: FastifyInstance,
  blobStorageService: BlobStorageService,
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

  // Upload user avatar
  fastify.post(
    '/api/upload/avatar',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        // Get the uploaded file
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        if (!BlobStorageService.isValidImageType(data.mimetype)) {
          return reply.status(400).send({
            error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
          });
        }

        // Read file buffer
        const buffer = await data.toBuffer();

        // Validate file size (5MB max)
        if (!BlobStorageService.isValidFileSize(buffer.length, 5)) {
          return reply.status(400).send({ error: 'File size must be less than 5MB' });
        }

        // Upload to blob storage
        const avatarUrl = await blobStorageService.uploadAvatar(
          buffer,
          data.filename,
          data.mimetype
        );

        // Delete old avatar if exists
        if (user.avatarUrl) {
          try {
            await blobStorageService.deleteFile(user.avatarUrl);
          } catch (error) {
            // Log but don't fail the request
            fastify.log.warn(error, 'Failed to delete old avatar');
          }
        }

        // Update user avatar in database
        await cosmosService.updateUserAvatar(user.id, avatarUrl);

        // Broadcast avatar updated event
        await signalrService.broadcastAvatarUpdated(user.id, avatarUrl);

        return reply.send({ avatarUrl });
      } catch (error) {
        fastify.log.error(error, 'Failed to upload avatar');
        return reply.status(500).send({ error: 'Failed to upload avatar' });
      }
    }
  );

  // Upload group photo
  fastify.post(
    '/api/upload/group/:groupId/photo',
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

        // Verify group exists and user is admin
        const group = await cosmosService.getGroupById(groupId);
        if (!group) {
          return reply.status(404).send({ error: 'Group not found' });
        }

        if (!group.admins.includes(user.id)) {
          return reply.status(403).send({ error: 'Only group admins can upload group photo' });
        }

        // Get the uploaded file
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        if (!BlobStorageService.isValidImageType(data.mimetype)) {
          return reply.status(400).send({
            error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
          });
        }

        // Read file buffer
        const buffer = await data.toBuffer();

        // Validate file size (5MB max)
        if (!BlobStorageService.isValidFileSize(buffer.length, 5)) {
          return reply.status(400).send({ error: 'File size must be less than 5MB' });
        }

        // Upload to blob storage
        const photoUrl = await blobStorageService.uploadGroupPhoto(
          buffer,
          data.filename,
          data.mimetype
        );

        // Delete old photo if exists
        if (group.avatarUrl) {
          try {
            await blobStorageService.deleteFile(group.avatarUrl);
          } catch (error) {
            // Log but don't fail the request
            fastify.log.warn(error, 'Failed to delete old group photo');
          }
        }

        // Update group photo in database
        const updatedGroup = await cosmosService.updateGroup(groupId, { avatarUrl: photoUrl });

        // Broadcast group photo updated event
        await signalrService.broadcastGroupUpdated(updatedGroup);

        return reply.send({ photoUrl });
      } catch (error) {
        fastify.log.error(error, 'Failed to upload group photo');
        return reply.status(500).send({ error: 'Failed to upload group photo' });
      }
    }
  );

  // Delete user avatar
  fastify.delete(
    '/api/upload/avatar',
    async (
      request: FastifyRequest<{
        Headers: { authorization?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = await authenticateUser(request, reply);
        if (!user) return;

        if (!user.avatarUrl) {
          return reply.status(404).send({ error: 'No avatar to delete' });
        }

        // Delete from blob storage
        await blobStorageService.deleteFile(user.avatarUrl);

        // Update user in database
        await cosmosService.updateUserAvatar(user.id, undefined);

        // Broadcast avatar removed event
        await signalrService.broadcastAvatarUpdated(user.id, undefined);

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete avatar');
        return reply.status(500).send({ error: 'Failed to delete avatar' });
      }
    }
  );
}
