import { FastifyInstance } from 'fastify';
import homeRoutes from './home';
import twitterScrapeRoutes from './twitter/scrape';
import twitterSearchRoutes from './twitter/search';

export default async function (fastify: FastifyInstance) {
  fastify.register(homeRoutes, { prefix: '/' });
  fastify.register(async (fastify) => {
    fastify.register(twitterScrapeRoutes, { prefix: '/scrape' });
    fastify.register(twitterSearchRoutes, { prefix: '/search' });
    // Register other scraping routes here
  }, { prefix: '/twitter' });
  
}
