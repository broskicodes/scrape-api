import { TwitterImportService } from '../services/twitterImportService';

export class TwitterImportController {
  private twitterImportService: TwitterImportService;

  constructor() {
    this.twitterImportService = new TwitterImportService();
  }

  async importTweets(urls: string[]) {
    try {
      const tweets = await this.twitterImportService.importTweets(urls);
      return {
        success: true,
        tweets
      };
    } catch (error) {
      console.error('Error in importTweets controller:', error);
      throw error;
    }
  }
} 