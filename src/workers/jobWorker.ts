import { parentPort } from 'worker_threads';
import { CronJobService } from '../services/cronJobService';

const cronJobService = new CronJobService();

parentPort?.on('message', async (jobId) => {
  console.log('jobId', jobId);
  try {
    await cronJobService.processJob(jobId);
    parentPort?.postMessage({ success: true, jobId });
  } catch (error) {
    parentPort?.postMessage({ success: false, error, jobId });
  }
}); 