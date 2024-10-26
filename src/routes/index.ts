import { FastifyInstance } from 'fastify';
import homeRoutes from './home';

export default async function (fastify: FastifyInstance) {
  fastify.register(homeRoutes, { prefix: '/' });
  // Register other route groups here
}
