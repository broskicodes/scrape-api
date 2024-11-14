import Fastify from 'fastify';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import cors from './plugins/cors';
import 'dotenv/config';
import { CronJobService } from './services/cronJobService';
import cron from 'node-cron';
import { getNextPendingJob } from './lib/drizzle';
import { setTimeout } from 'timers/promises';
import { TwitterUsersService } from './services/twitterUsersService';
import { TwitterScrapeType } from './lib/types';

const server = Fastify({
  logger: true
});

const cronJobService = new CronJobService();
const twitterUsersService = new TwitterUsersService();

// Register plugins
server.register(cors);

// Register routes
server.register(routes);

// Error handler
server.setErrorHandler(errorHandler);

async function processJobs() {
  while (true) {
    const job = await getNextPendingJob();
    if (job) {
      await cronJobService.processJob(job.id);
      // Immediately check for the next job
      continue;
    }
    // If no job is found, wait for 5 seconds before checking again
    await setTimeout(10000);
  }
}

// Start the job processing loop
processJobs().catch(error => {
  console.error('Job processing error:', error);
  // Implement proper error handling and potentially restart the loop
});

// Schedule the daily cron job to run at midnight (00:00)
const scrapeCronJob = cron.schedule('0 0 * * *', async () => {
  console.log('Running daily Twitter scrape job scheduler');
  await cronJobService.scheduleDailyTwitterScrapeJobs();
});

const followerUpdateCronJob = cron.schedule('0 */12 * * *', async () => {
  console.log('Running daily Twitter follower update job scheduler');
  await cronJobService.scheduleFollowerUpdateJobs();
});

const start = async () => {
  try {
    // Start the cron job
    scrapeCronJob.start();
    followerUpdateCronJob.start();
    console.log('Cron job started');

    await server.listen({
      port: config.port as number,
      host: '0.0.0.0'
    });
    console.log(`Server listening on http://localhost:${config.port}`);

    // await twitterUsersService.importUsers(['levelsio']);
    // await cronJobService.scheduleDailyTwitterScrapeJobs();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
