import { FastifyInstance } from 'fastify';
import { HomeController } from '../controllers/homeController';
import { HomeService } from '../services/homeService';
import { homeSchema } from '../schemas/home';

export default async function (fastify: FastifyInstance) {
  const homeService = new HomeService();
  const homeController = new HomeController(homeService);

  fastify.get('/', { schema: homeSchema }, homeController.getHome.bind(homeController));
}
