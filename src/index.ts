import Fastify from 'fastify';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import cors from './plugins/cors';
import 'dotenv/config';
import { CronJobService } from './services/cronJobService';
import cron from 'node-cron';
import { getNextPendingJob, getNextScheduledPost } from './lib/drizzle';
import { setTimeout } from 'timers/promises';
import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';
import websocketPlugin from './plugins/websocket';

const cronJobService = new CronJobService();
const server = Fastify({
  logger: true
});

// Register plugins
server.register(cors);
server.register(websocketPlugin);

// Register routes
server.register(routes);

// Error handler
server.setErrorHandler(errorHandler);

async function createJobWorker() {
  const worker = new Worker(path.join(__dirname, 'workers/jobWorker.js'));
  
  while (true) {
    const job = await getNextPendingJob();
    if (job) {
      worker.postMessage(job.id);
      // Wait for job completion
      await new Promise((resolve, reject) => {
        worker.once('message', (result) => {
          if (result.success) resolve(result);
          else reject(result.error);
        });
      });
      continue;
    }
    await setTimeout(10000);
  }
}

async function createPostWorker() {
  const worker = new Worker(path.join(__dirname, 'workers/postWorker.js'));
  
  while (true) {
    const draft = await getNextScheduledPost();
    if (draft) {
      worker.postMessage(draft.id);
      // Wait for job completion
      await new Promise((resolve, reject) => {
        worker.once('message', (result) => {
          if (result.success) resolve(result);
          else reject(result.error);
        });
      });
      continue;
    }
    await setTimeout(10000);
  }
}

async function startWorkerPool() {
  const numWorkers = Math.min(os.cpus().length, 1);
  
  const workers = Array(numWorkers).fill(null).map((_, i) => {
    console.log(`Starting job worker ${i + 1}`);
    
    return createJobWorker().catch(error => {
      console.error('Job worker error:', error);
      return Promise.resolve();
    });
  });

  const postWorkers = Array(1).fill(null).map((_, i) => {
    console.log(`Starting post worker ${i + 1}`);
    
    return createPostWorker().catch(error => {
      console.error('Post worker error:', error);
      return Promise.resolve();
    });
  });

  return Promise.all(workers.concat(postWorkers));
}

// Schedule the daily cron job to run at midnight (00:00)
const scrapeCronJob = cron.schedule('0 0 * * *', async () => {
  console.log('Running daily Twitter scrape job scheduler');
  await cronJobService.scheduleDailyTwitterScrapeJobs();
});

const followerUpdateCronJob = cron.schedule('0 */12 * * *', async () => {
  console.log('Running daily Twitter follower update job scheduler');
  await cronJobService.scheduleFollowerUpdateJobs();
});

// const weeklyScrapeCronJob = cron.schedule('0 0 * * 0', async () => {
//   console.log('Running weekly Twitter scrape job scheduler');
//   await cronJobService.scheduleWeeklyTwitterScrapeJobs();
// });

const start = async () => {
  try {
    // Start the cron job
    scrapeCronJob.start();
    followerUpdateCronJob.start();
    // weeklyScrapeCronJob.start();
    console.log('Cron job started');

    await server.listen({
      port: config.port as number,
      host: '0.0.0.0'
    });
    console.log(`Server listening on http://localhost:${config.port}`);

    // await twitterUsersService.importUsers(['levelsio']);
    // await cronJobService.scheduleDailyTwitterScrapeJobs();

    startWorkerPool().catch(error => {
      console.error('Worker pool error:', error);
      process.exit(1);
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
