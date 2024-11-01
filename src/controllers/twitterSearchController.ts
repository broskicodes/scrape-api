import { TwitterSearchService } from '../services/twitterSearchService';
import { SearchFilters } from '../lib/types';

export class TwitterSearchController {
  private searchService: TwitterSearchService;

  constructor() {
    this.searchService = new TwitterSearchService();
  }

  async searchTweets(userId: string, query: string, filters: SearchFilters) {
    try {
      const results = await this.searchService.search(userId, query, filters);
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error in searchTweets:', error);
      throw error;
    }
  }
} 