import { addJobToDb, addTweetsToDb, updateJobStatus } from '../lib/drizzle';
import { TwitterScrapeType, Job } from '../lib/types';
import { getSinceDate } from '../lib/utils';
import crypto from 'crypto';
import { CronJobService } from './cronJobService';

export class TwitterScraperService {
  private cronJobService: CronJobService;

  constructor() {
    this.cronJobService = new CronJobService();
  }

  async startScrapeJob(scrapeType: TwitterScrapeType, handles: string[]): Promise<string> {
    const sinceDate = getSinceDate(scrapeType);

      const input = {
        "searchTerms": handles.map((handle: string) => `from:${handle} since:${sinceDate} -filter:replies`),
        "sort": "Latest",
        "tweetLanguage": "en",
      };

    const job: Job = {
      id: crypto.randomUUID(),
      status: 'pending',
      type: 'twitter_scrape',
      params: JSON.stringify({input: input, env: process.env.ENVIRONMENT}),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await addJobToDb(job);

    // Start the background job
    // this.runScrapeJob(job.id, input).catch(console.error);

    return job.id;
  }

  // Overload signatures
  async runScrapeJob(scrapeType: TwitterScrapeType, handles: string[]): Promise<boolean>;
  async runScrapeJob(input: {
    input?: {
      searchTerms?: string[],
      sort?: string,
      tweetLanguage?: string,
      maxItems?: number
    }
  }): Promise<boolean>;

  // Implementation
  async runScrapeJob(
    scrapeTypeOrInput: TwitterScrapeType | { input?: {
      searchTerms?: string[],
      sort?: string,
      tweetLanguage?: string,
      maxItems?: number
    } },
    handles?: string[]
  ): Promise<boolean> {
    const isSimpleVersion = typeof scrapeTypeOrInput === 'string';
    
    let input;
    
    if (isSimpleVersion) {
      const sinceDate = getSinceDate(scrapeTypeOrInput);

      input = {
        searchTerms: handles!.map(handle => `from:${handle} since:${sinceDate} -filter:replies`),
        sort: "Latest",
        tweetLanguage: "en",
        maxItems: 1500,
      };
    } else {
      input = scrapeTypeOrInput.input;
    }

    const job: Job = {
      id: crypto.randomUUID(),
      status: 'running',
      type: 'twitter_scrape',
      params: JSON.stringify({input: input, env: process.env.ENVIRONMENT}),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await addJobToDb(job);

    try {
      const tweets = await this.cronJobService.runScrapeJob(job.id, input);
      await updateJobStatus(job.id, 'completed');
      await addTweetsToDb(tweets);
      return true;
    } catch (error) {
      console.error('Error in runScrapeJob:', error);
      return false;
    }
  }
}
