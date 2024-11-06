import { runApifyActor } from '../lib/apify';
import { APIFY_TWEET_SCRAPER_ACTOR } from '../lib/constant';
import { saveSearchToDb } from '../lib/drizzle';
import { Tweet, SearchFilters } from '../lib/types';

export class TwitterSearchService {
  private getDateRangeQuery(range: string): string {
    const now = new Date();
    
    switch (range) {
      case '24h':
        now.setHours(now.getHours() - 24);
        break;
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '28d':
        now.setDate(now.getDate() - 28);
        break;
      case 'all':
        now.setFullYear(2023, 0, 1); // Jan 1, 2023
        now.setHours(0, 0, 0, 0);
        return '';
      default:
        return '';
    }

    // Format as YYYY-MM-DD_HH:mm:ss_UTC
    const formattedDate = now.toISOString()
      .replace('T', '_')
      .replace(/\.\d+Z$/, '_UTC');

    return ` since:${formattedDate}`;
  }

  private buildSearchQuery(query: string, filters: SearchFilters): string {
    let searchQuery = `"${query}"`;

    // Build search query with filters
    if (filters) {
      if (filters.verified) searchQuery += ' filter:blue_verified';
      if (filters.mediaOnly) searchQuery += ' filter:media';
      if (filters.linksOnly) searchQuery += ' filter:links';
      if (filters.quoteTweetsOnly) searchQuery += ' filter:quote';
      if (filters.minLikes) searchQuery += ` min_faves:${filters.minLikes}`;
      if (filters.minComments) searchQuery += ` min_replies:${filters.minComments}`;
      if (filters.minRetweets) searchQuery += ` min_retweets:${filters.minRetweets}`;
      if (filters.dateRange) searchQuery += this.getDateRangeQuery(filters.dateRange);
      if (filters.threadOnly) searchQuery += ' filter:self_threads';
    }

    return searchQuery;
  }

  async search(userId: string, query: string, filters: SearchFilters): Promise<Tweet[]> {
    try {
      // Save search to DB if userId is provided
      if (userId) {
        await saveSearchToDb({
          userId,
          query,
          filters: filters || {}
        });
      }

      const searchQuery = this.buildSearchQuery(query, filters);

      const input = {
        "searchTerms": [searchQuery],
        "sort": "Top",
        "maxItems": 10,
        "tweetLanguage": "en",
      };

      console.log(JSON.stringify(input, null, 2));

      const result = await runApifyActor(APIFY_TWEET_SCRAPER_ACTOR, input);

      return result.filter((item: any) => item.author).map((item: any) => ({
        author: {
          id: item.author.id,
          name: item.author.name,
          handle: item.author.userName,
          pfp: item.author.profilePicture,
          url: item.author.url,
          verified: item.author.isBlueVerified,
          followers: item.author.followers,
        },
        tweet_id: item.id,
        url: item.url,
        text: item.text,
        date: item.createdAt,
        bookmark_count: item.bookmarkCount,
        retweet_count: item.retweetCount,
        reply_count: item.replyCount,
        like_count: item.likeCount,
        quote_count: item.quoteCount,
        view_count: item.viewCount,
        language: item.lang,
        is_reply: item.isReply,
        is_retweet: item.isRetweet,
        is_quote: item.isQuote,
        entities: item.entities,
        is_thread: false,
      }));
    } catch (error) {
      console.error('Error in search:', error);
      throw error;
    }
  }
} 