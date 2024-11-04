import { runApifyActor } from '../lib/apify';
import { APIFY_TWEET_SCRAPER_ACTOR } from '../lib/constant';
import { addTweetsToDb, addJobToDb, updateJobStatus } from '../lib/drizzle';
import { TwitterScrapeType, Tweet, Job } from '../lib/types';
import { getSinceDate } from '../lib/utils';
import crypto from 'crypto';

export class TwitterScraperService {
  async startScrapeJob(scrapeType: TwitterScrapeType, handles: string[]): Promise<string> {
    const job: Job = {
      id: crypto.randomUUID(),
      status: 'pending',
      type: 'twitter_scrape',
      params: JSON.stringify({ scrapeType, handles }),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await addJobToDb(job);

    // Start the background job
    this.runScrapeJob(job.id, scrapeType, handles).catch(console.error);

    return job.id;
  }

  async runScrapeJob(jobId: string, scrapeType: TwitterScrapeType, handles: string[]): Promise<void> {
    try {
      await updateJobStatus(jobId, 'running');

      const sinceDate = getSinceDate(scrapeType);

      const input = {
        "searchTerms": handles.map((handle: string) => `from:${handle} since:${sinceDate} -filter:replies`),
        "sort": "Latest",
        "tweetLanguage": "en",
      };

      const result = await runApifyActor(APIFY_TWEET_SCRAPER_ACTOR, input);

      const stats: Tweet[] = result.filter((item: any) => item.author).map((item: any) => ({
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
      }));

      await addTweetsToDb(stats);
      await updateJobStatus(jobId, 'completed');
    } catch (error) {
      console.error('Error in runScrapeJob:', error);
      await updateJobStatus(jobId, 'failed');
    }
  }
}
