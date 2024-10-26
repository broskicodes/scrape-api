import { runApifyActor } from '../lib/apify';
import { APIFY_TWEET_SCRAPER_ACTOR } from '../lib/constant';
import { addTweetsToDb } from '../lib/drizzle';
import { TwitterScrapeType, Tweet } from '../lib/types';
import { getSinceDate } from '../lib/utils';

export class TwitterScraperService {
  async scrape(scrapeType: TwitterScrapeType, handles: string[]): Promise<Tweet[]> {
    const sinceDate = getSinceDate(scrapeType);

    const input = {
      "searchTerms": handles.map((handle: string) => `from:${handle} since:${sinceDate} -filter:replies -filter:quotes`),
      "sort": "Latest",
      "tweetLanguage": "en",
    };

    const result = await runApifyActor(APIFY_TWEET_SCRAPER_ACTOR, input);

    const stats: Tweet[] = result.map((item: any) => ({
      author: {
        id: item.author.id,
        handle: item.author.userName,
        pfp: item.author.profilePicture,
        url: item.author.url,
      },
      tweet_id: item.id,
      url: item.url,
      date: item.createdAt,
      bookmark_count: item.bookmarkCount,
      retweet_count: item.retweetCount,
      reply_count: item.replyCount,
      like_count: item.likeCount,
      quote_count: item.quoteCount,
      view_count: item.viewCount
    }));

    // console.log(stats);

    await addTweetsToDb(stats);

    return stats;
  }
}
