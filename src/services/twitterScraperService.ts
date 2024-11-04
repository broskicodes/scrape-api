import { addJobToDb } from '../lib/drizzle';
import { TwitterScrapeType, Job } from '../lib/types';
import { getSinceDate } from '../lib/utils';
import crypto from 'crypto';

export class TwitterScraperService {
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
}
