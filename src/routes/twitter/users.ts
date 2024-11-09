import { FastifyInstance } from 'fastify';
import { TwitterUsersController } from '../../controllers/twitterUsersController';
import { twitterUsersSchema } from '../../schemas/twitterUsers';

export default async function (fastify: FastifyInstance) {
  const controller = new TwitterUsersController();

  fastify.post('/import', {
    schema: twitterUsersSchema,
    handler: async (request) => {
      const { handles } = request.body as { handles: string[] };
      return controller.importUsers(handles);
    }
  });
} 