import { TwitterScraperService } from './twitterScraperService';
import { getJobById, updateJobStatus, getTwitterHandles, addJobToDb, getSomeTweets, addTweetsToDb, addThreadsToDb, addTweetersToDb, getHandleForSubscribedUsers, getTwitterHandlesWithProfiles } from '../lib/drizzle';
import { Job, Tweet, TwitterAuthor, TwitterScrapeType } from '../lib/types';
import { TwitterImportService } from './twitterImportService';
import { runApifyActor } from '../lib/apify';
import { APIFY_TWITTER_USER_ACTOR, APIFY_TWEET_SCRAPER_ACTOR } from '../lib/constant';
import { chunkArray, getSinceDate } from '../lib/utils';

export class CronJobService {
  async scheduleDailyTwitterScrapeJobs(type?: TwitterScrapeType): Promise<void> {
    try {
      // Fetch all handles from the twitterHandles table
      const handles = await getHandleForSubscribedUsers();
      // const handles = await getTwitterHandles();

      // Group handles into batches of 10
      const handleBatches = chunkArray(handles, 50);

      // Create a job for each batch
      const sinceDate = getSinceDate(type || TwitterScrapeType.Update);

      for (const batch of handleBatches) {
        const input = {
          "searchTerms": batch.map((handle: string) => 
            `from:${handle} since:${sinceDate} -filter:replies`
          ),
          "sort": "Latest",
          "tweetLanguage": "en",
        };

        await addJobToDb({
          id: crypto.randomUUID(),
          status: 'pending',
          type: 'twitter_scrape',
          params: JSON.stringify({
            input: input,
            env: process.env.ENVIRONMENT
            // env: 'production'
          }),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    
      console.log(`Scheduled ${handleBatches.length} Twitter scrape jobs`);
    } catch (error) {
      console.error('Error scheduling daily Twitter scrape jobs:', error);
    }
  }

  async scheduleWeeklyTwitterScrapeJobs(): Promise<void> {
    try {
      const handles = await getTwitterHandlesWithProfiles();
      const handleBatches = chunkArray(handles, 50);

      const sinceDate = getSinceDate(TwitterScrapeType.Weekly);

      for (const batch of handleBatches) {
        // Get tweets from the last 7 days
        const input = {
          "searchTerms": batch.map((handle: string) => 
            `from:${handle} since:${sinceDate} -filter:replies`
          ),
          "sort": "Latest",
          "tweetLanguage": "en",
        };

        await addJobToDb({
          id: crypto.randomUUID(),
          status: 'pending',
          type: 'twitter_scrape',
          params: JSON.stringify({
            input,
            env: process.env.ENVIRONMENT
          }),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      console.log(`Scheduled ${handleBatches.length} weekly Twitter scrape jobs`);
    } catch (error) {
      console.error('Error scheduling weekly Twitter scrape jobs:', error);
    }
  }

  async scheduleFollowerUpdateJobs(): Promise<void> {
    try {
      const handles = await getHandleForSubscribedUsers();
      let batches = chunkArray(handles, 100);

      if (batches.length > 1 && batches[batches.length - 1].length < 5) {
        const lastBatch = batches.pop()!;
        batches[batches.length - 1].push(...lastBatch); 
      }

      for (const batch of batches) {
        const input = {
          "getFollowers": false,
          "getFollowing": false,
          "getRetweeters": false,
          "includeUnavailableUsers": false,
          "twitterHandles": batch,
        };

        await addJobToDb({
          id: crypto.randomUUID(),
          status: 'pending',
          type: 'follower_update',
          params: JSON.stringify({ input: input, env: process.env.ENVIRONMENT }),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      console.log(`Scheduled ${batches.length} follower update jobs`);
    } catch (error) {
      console.error('Error scheduling follower update jobs:', error);
    }
  }

  // async scheduleThreadImportJobs(): Promise<void> {
  //   const tweets = await getSomeTweets();

  //   const tweetBatches = chunkArray(tweets.map((tweet) => tweet.url), 100);

  //   for (const batch of tweetBatches) {
  //     await this.twitterImportService.importTweets(batch);
  //   }
  // }

  async processJob(jobId: string): Promise<void> {
    const job = await getJobById(jobId);

    if (!job) {
      console.error(`Job with ID ${jobId} not found`);
      return;
    }

    if (job.status !== 'pending') {
      console.log(`Job ${jobId} is not pending, skipping`);
      return;
    }

    try {
      const params = JSON.parse(job.params);

      if (params.env !== process.env.ENVIRONMENT) {
        console.log(`Job ${jobId} is not in the correct environment, skipping`);
        return;
      }

      await updateJobStatus(jobId, 'running');
      switch (job.type) {
        case 'twitter_scrape': {
          const tweets = await this.runScrapeJob(jobId, params.input);
          await addTweetsToDb(tweets);
          break;
        }
        case 'thread_import': {
          const tweets = await this.runScrapeJob(jobId, params.input);
          await addThreadsToDb(tweets);
          break;
        }
        case 'follower_update': {
          const tweeters = await this.runFollowerUpdateJob(jobId, params.input);
          await addTweetersToDb(tweeters);
          break;
        }
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      await updateJobStatus(jobId, 'completed');
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await updateJobStatus(jobId, 'failed');
    }
  }

  async runFollowerUpdateJob(jobId: string, input: any): Promise<TwitterAuthor[]> {
    try {
      await updateJobStatus(jobId, 'running');

      const result = await runApifyActor(APIFY_TWITTER_USER_ACTOR, input);
      const tweeters = result.filter((item: any) => item.id).map((item: any) => ({
        id: item.id,
        name: item.name,
        handle: item.userName,
        pfp: item.profilePicture,
        url: item.url,
        description: item.description,
        verified: item.isVerified,
        followers: item.followers,
      }));

      return tweeters;
    } catch (error) {
      console.error('Error in runFollowerUpdateJob:', error);
      await updateJobStatus(jobId, 'failed');
      return [];
    }
  }

  async runScrapeJob(jobId: string, input: any): Promise<Tweet[]> {
    try {
      await updateJobStatus(jobId, 'running');
      console.log('Running scrape job', jobId);

      const result = await runApifyActor(APIFY_TWEET_SCRAPER_ACTOR, input);

      const tweets: Tweet[] = result.filter((item: any) => item.author).map((item: any) => ({
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
        thread_id: item.conversationId,
      }));

      return tweets;
    } catch (error) {
      console.error('Error in runScrapeJob:', error);
      await updateJobStatus(jobId, 'failed');
      return [];
    }
  }
}
