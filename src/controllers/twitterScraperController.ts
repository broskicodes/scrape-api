import { TwitterScraperService } from '../services/twitterScraperService';
import { TwitterScrapeType, Tweet } from '../lib/types';

export class TwitterScraperController {
  private scraperService: TwitterScraperService;

  constructor() {
    this.scraperService = new TwitterScraperService();
  }

  async scrapeTwitterWithParams(scrapeType: TwitterScrapeType, handles: string[]): Promise<Tweet[]> {
    return this.scraperService.scrape(scrapeType, handles);
  }
}
