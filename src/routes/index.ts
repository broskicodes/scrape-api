import { FastifyInstance } from 'fastify';
import homeRoutes from './home';
import twitterScrapingRoutes from './scrape/twitter';

export default async function (fastify: FastifyInstance) {
  fastify.register(homeRoutes, { prefix: '/' });
  fastify.register(async (fastify) => {
    fastify.register(twitterScrapingRoutes, { prefix: '/twitter' });
    // Register other scraping routes here
  }, { prefix: '/scrape' });
  // Register other route groups here
}
