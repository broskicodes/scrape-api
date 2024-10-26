import Fastify from 'fastify';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import cors from './plugins/cors';

const server = Fastify({
  logger: true
});

// Register plugins
server.register(cors);

// Register routes
server.register(routes);

// Error handler
server.setErrorHandler(errorHandler);

const start = async () => {
  try {
    await server.listen({ port: config.port as number });
    console.log(`Server listening on http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
