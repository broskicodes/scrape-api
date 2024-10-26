import { TwitterScraperService } from './twitterScraperService';
import { getJobById, updateJobStatus } from '../lib/drizzle';
import { Job } from '../lib/types';

export class BackgroundJobService {
  private twitterScraperService: TwitterScraperService;

  constructor() {
    this.twitterScraperService = new TwitterScraperService();
  }

  async processJob(jobId: string): Promise<void> {
    const job = await getJobById(jobId);

    if (!job) {
      console.error(`Job with ID ${jobId} not found`);
      return;
    }

    if (job.status !== 'pending') {
      console.log(`Job ${jobId} is not pending, skipping`);
      return;
    }

    try {
      await updateJobStatus(jobId, 'running');

      switch (job.type) {
        case 'twitter_scrape':
          await this.processTwitterScrapeJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      await updateJobStatus(jobId, 'completed');
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await updateJobStatus(jobId, 'failed');
    }
  }

  private async processTwitterScrapeJob(job: Job): Promise<void> {
    const params = JSON.parse(job.params);
    await this.twitterScraperService.runScrapeJob(job.id, params.scrapeType, params.handles);
  }
}
