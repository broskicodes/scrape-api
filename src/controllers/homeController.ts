import { FastifyReply, FastifyRequest } from 'fastify';
import { HomeService } from '../services/homeService';

export class HomeController {
  constructor(private homeService: HomeService) {}

  async getHome(request: FastifyRequest, reply: FastifyReply) {
    const message = this.homeService.getWelcomeMessage();
    return { message };
  }
}
