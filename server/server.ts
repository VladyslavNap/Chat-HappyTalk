// Load environment variables from .env file (for local development)
import { config } from 'dotenv';
config();

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { join } from 'path';
import { CosmosService } from './services/cosmos.service.js';
import { SignalRService } from './services/signalr.service.js';
import { AuthService } from './services/auth.service.js';
import { BlobStorageService } from './services/blob-storage.service.js';
import { registerApiRoutes } from './routes/api.js';
import { registerContactsRoutes } from './routes/contacts.js';
import { registerGroupsRoutes } from './routes/groups.js';
import { registerUploadRoutes } from './routes/upload.js';

/**
 * HappyTalk Fastify Server
 * - Serves Angular SPA from dist/happy-talk/browser
 * - Exposes /api/** routes for chat functionality
 * - Integrates Azure SignalR for real-time messaging
 * - Persists messages to Cosmos DB SQL
 * 
 * Environment variables are loaded from .env file for local development.
 * In production (Azure App Service), use Application Settings instead.
 */
async function startServer(): Promise<void> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // CORS configuration
  // In production: Set CORS_ORIGIN env var to 'true' for all origins or comma-separated URLs
  // In development: Defaults to localhost URLs
  const getCorsOrigin = () => {
    if (!process.env.CORS_ORIGIN) {
      return ['http://localhost:4200', 'http://127.0.0.1:4200'];
    }
    if (process.env.CORS_ORIGIN === 'true') {
      return true;
    }
    return process.env.CORS_ORIGIN.split(',').map(url => url.trim());
  };

  await fastify.register(fastifyCors, {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Register multipart/form-data support for file uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1, // Max 1 file per request
    },
  });

  // Initialize services
  const cosmosService = new CosmosService();
  const signalrService = new SignalRService();
  const authService = new AuthService(cosmosService);
  const blobStorageService = new BlobStorageService();

  try {
    await cosmosService.initialize();
    fastify.log.info('Cosmos DB service initialized');
  } catch (error) {
    fastify.log.error(error, 'Failed to initialize Cosmos DB service');
    process.exit(1);
  }

  fastify.log.info('SignalR service initialized');

  // Register API routes
  await registerApiRoutes(fastify, cosmosService, signalrService, authService);
  await registerContactsRoutes(fastify, cosmosService, signalrService, authService);
  await registerGroupsRoutes(fastify, cosmosService, signalrService, authService);
  await registerUploadRoutes(fastify, blobStorageService, cosmosService, signalrService, authService);

  // Serve Angular SPA static files
  // Use process.cwd() to get the project root directory
  const staticPath = join(process.cwd(), 'dist', 'happy-talk', 'browser');
  await fastify.register(fastifyStatic, {
    root: staticPath,
    prefix: '/',
    decorateReply: true,
  });

  // SPA fallback - serve index.html for non-API routes
  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Don't serve index.html for API routes
    if (request.url.startsWith('/api/')) {
      return reply.status(404).send({ error: 'API endpoint not found' });
    }
    // Serve index.html for SPA routing
    return reply.sendFile('index.html');
  });

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'] as const;
  signals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, shutting down gracefully...`);
      await fastify.close();
      process.exit(0);
    });
  });

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

startServer();
