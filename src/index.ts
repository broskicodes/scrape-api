import Fastify from 'fastify';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import cors from './plugins/cors';
import 'dotenv/config';
import { BackgroundJobService } from './services/backgroundJobService';
import { getNextPendingJob } from './lib/drizzle';

const server = Fastify({
  logger: true
});

// Register plugins
server.register(cors);

// Register routes
server.register(routes);

// Error handler
server.setErrorHandler(errorHandler);

// const backgroundJobService = new BackgroundJobService();

// async function processNextJob() {
//   const job = await getNextPendingJob();
//   if (job) {
//     await backgroundJobService.processJob(job.id);
//   }
// }

// // Run job processing every 5 seconds
// setInterval(processNextJob, 5000);

const start = async () => {
  try {
    await server.listen({
      port: config.port as number,
      host: '0.0.0.0'
    });
    console.log(`Server listening on http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
