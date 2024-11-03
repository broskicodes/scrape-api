import { FastifyInstance } from 'fastify';
import { TwitterImportController } from '../../controllers/twitterImportController';
import { twitterImportSchema } from '../../schemas/twitterImport';

export default async function twitterImportRoutes(fastify: FastifyInstance) {
  const twitterImportController = new TwitterImportController();

  fastify.post<{
    Body: {
      urls: string[];
    };
  }>('/', {
    schema: twitterImportSchema,
    handler: async (request, reply) => {
      const { urls } = request.body;
      
      try {
        const result = await twitterImportController.importTweets(urls);
        return result;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
          success: false, 
          error: 'Failed to import tweets' 
        });
      }
    },
  });
} 