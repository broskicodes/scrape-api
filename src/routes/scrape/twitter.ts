import { FastifyInstance } from 'fastify';
import { TwitterScraperController } from '../../controllers/twitterScraperController';
import { twitterScrapeSchema } from '../../schemas/twitterScrape';
import { TwitterScrapeType } from '../../lib/types';
import { CronJobService } from '../../services/cronJobService';

export default async function (fastify: FastifyInstance) {
  const twitterScraperController = new TwitterScraperController();
  const cronJobService = new CronJobService();

  fastify.post<{
    Body: { scrapeType: TwitterScrapeType; handles: string[] };
  }>('/', { schema: twitterScrapeSchema }, async (request, reply) => {
    const { scrapeType, handles } = request.body;
    const jobId = await twitterScraperController.startTwitterScrapeJob(scrapeType, handles);
    return { message: 'Twitter scrape job started', jobId };
  });

  fastify.post('/run-all', async (request, reply) => {
    try {
      await cronJobService.scheduleDailyTwitterScrapeJobs(TwitterScrapeType.Initialize);
      return { message: 'Twitter scrape jobs scheduled successfully' };
    } catch (error) {
      fastify.log.error('Error scheduling Twitter scrape jobs:', error);
      return reply.status(500).send({ 
        error: 'Failed to schedule Twitter scrape jobs' 
      });
    }
  });
}
