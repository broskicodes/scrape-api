import { FastifyInstance } from 'fastify';
import { TwitterScraperController } from '../../controllers/twitterScraperController';
import { twitterScrapeSchema } from '../../schemas/twitterScrape';
import { TwitterScrapeType } from '../../lib/types';

export default async function (fastify: FastifyInstance) {
  const twitterScraperController = new TwitterScraperController();

  fastify.post<{
    Body: { scrapeType: TwitterScrapeType; handles: string[] };
  }>('/', { schema: twitterScrapeSchema }, async (request, reply) => {
    const { scrapeType, handles } = request.body;
    const jobId = await twitterScraperController.startTwitterScrapeJob(scrapeType, handles);
    return { message: 'Twitter scrape job started', jobId };
  });
}
