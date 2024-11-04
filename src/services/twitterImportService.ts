import { runApifyActor } from '../lib/apify';
import { APIFY_TWEET_SCRAPER_ACTOR } from '../lib/constant';
import { Tweet } from '../lib/types';
import { addTweetsToDb } from '../lib/drizzle';

export class TwitterImportService {
  async importTweets(urls: string[]): Promise<Tweet[]> {
    console.log(urls.length);
    try {
      const input = {
        "sort": "Top",
        "startUrls": urls,
        "maxItems": 50
      };

      const result = await runApifyActor(APIFY_TWEET_SCRAPER_ACTOR, input);

      const importedTweets = result
        .filter((item: any) => item.author)
        .map((item: any) => ({
          author: {
            id: item.author.id,
            name: item.author.name,
            handle: item.author.userName,
            followers: item.author.followers,
            pfp: item.author.profilePicture,
            url: item.author.url,
            verified: item.author.isBlueVerified,
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
        }));

      await addTweetsToDb(importedTweets);

      return importedTweets;
    } catch (error) {
      console.error('Error importing tweets:', error);
      throw error;
    }
  }
} 