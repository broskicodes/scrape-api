import { TwitterScraperService } from './twitterScraperService';
import { getJobById, updateJobStatus, getTwitterHandles, addJobToDb, getSomeTweets } from '../lib/drizzle';
import { Job, TwitterScrapeType } from '../lib/types';
import { TwitterImportService } from './twitterImportService';

export class CronJobService {
  private twitterScraperService: TwitterScraperService;
  private twitterImportService: TwitterImportService;

  constructor() {
    this.twitterScraperService = new TwitterScraperService();
    this.twitterImportService = new TwitterImportService();
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

  async scheduleDailyTwitterScrapeJobs(type?: TwitterScrapeType): Promise<void> {
    try {
      // Fetch all handles from the twitterHandles table
      const handles = await getTwitterHandles();

      // Group handles into batches of 10
      const handleBatches = this.chunkArray(handles, 10);

      // Create a job for each batch
      for (const batch of handleBatches) {
        await addJobToDb({
          id: crypto.randomUUID(),
          status: 'pending',
          type: 'twitter_scrape',
          params: JSON.stringify({
            scrapeType: type || TwitterScrapeType.Update,
            handles: batch
          }),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    
      console.log(`Scheduled ${handleBatches.length} Twitter scrape jobs`);
    } catch (error) {
      console.error('Error scheduling daily Twitter scrape jobs:', error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
