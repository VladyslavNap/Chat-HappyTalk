import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { join } from 'path';
import { CosmosService } from './services/cosmos.service.js';
import { SignalRService } from './services/signalr.service.js';
import { registerApiRoutes } from './routes/api.js';

/**
 * HappyTalk Fastify Server
 * - Serves Angular SPA from dist/happy-talk/browser
 * - Exposes /api/** routes for chat functionality
 * - Integrates Azure SignalR for real-time messaging
 * - Persists messages to Cosmos DB SQL
 */
async function startServer(): Promise<void> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // CORS configuration for development
  await fastify.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Initialize services
  const cosmosService = new CosmosService();
  const signalrService = new SignalRService();

  try {
    await cosmosService.initialize();
    fastify.log.info('Cosmos DB service initialized');
  } catch (error) {
    fastify.log.error(error, 'Failed to initialize Cosmos DB service');
    process.exit(1);
  }

  fastify.log.info('SignalR service initialized');

  // Register API routes
  await registerApiRoutes(fastify, cosmosService, signalrService);

  // Serve Angular SPA static files
  // Use process.cwd() to get the project root directory
  const staticPath = join(process.cwd(), 'dist', 'happy-talk', 'browser');
  await fastify.register(fastifyStatic, {
    root: staticPath,
    prefix: '/',
    decorateReply: false,
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
