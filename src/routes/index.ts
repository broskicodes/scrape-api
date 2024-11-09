import { FastifyInstance } from 'fastify';
import homeRoutes from './home';
import twitterScrapeRoutes from './twitter/scrape';
import twitterSearchRoutes from './twitter/search';
import twitterImportRoutes from './twitter/import';
import twitterUsersRoutes from './twitter/users';

export default async function (fastify: FastifyInstance) {
  fastify.register(homeRoutes, { prefix: '/' });
  fastify.register(async (fastify) => {
    fastify.register(twitterScrapeRoutes, { prefix: '/scrape' });
    fastify.register(twitterSearchRoutes, { prefix: '/search' });
    fastify.register(twitterImportRoutes, { prefix: '/import' });
    fastify.register(twitterUsersRoutes, { prefix: '/users' });
  }, { prefix: '/twitter' });
}
