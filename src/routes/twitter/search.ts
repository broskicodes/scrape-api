import { FastifyInstance } from 'fastify';
import { TwitterSearchController } from '../../controllers/twitterSearchController';
import { twitterSearchSchema, SearchFilters } from '../../schemas/twitterSearch';

export default async function twitterSearchRoutes(fastify: FastifyInstance) {
  const twitterSearchController = new TwitterSearchController();

  fastify.post<{
    Body: {
      userId: string;
      query: string;
      filters: SearchFilters;
    };
  }>('/', {
    schema: twitterSearchSchema,
    handler: async (request, reply) => {
      const { userId, query, filters } = request.body;
      
      try {
        const result = await twitterSearchController.searchTweets(userId, query, filters);
        return result;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
          success: false, 
          error: 'Failed to search tweets' 
        });
      }
    },
  });
} 