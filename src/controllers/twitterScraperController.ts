import { TwitterScraperService } from '../services/twitterScraperService';
import { TwitterScrapeType } from '../lib/types';

export class TwitterScraperController {
  private scraperService: TwitterScraperService;

  constructor() {
    this.scraperService = new TwitterScraperService();
  }

  async startTwitterScrapeJob(scrapeType: TwitterScrapeType, handles: string[]): Promise<string> {
    return this.scraperService.startScrapeJob(scrapeType, handles);
  }
}
