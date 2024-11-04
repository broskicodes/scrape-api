import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from './db-schema';
import { desc, eq, gte, isNull } from 'drizzle-orm';
import { Job, JobStatus, Tweet, SearchFilters, TweetEntity } from './types';
import { jobs, searches } from './db-schema';

// Function to get or create Pool
function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables');
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

// Function to get or create db
export function getDb() {
  const pool = getPool();
  return drizzle(pool, { schema });
}

export async function addTweetsToDb(tweets: Tweet[]) {
  const db = getDb();

  for (const tweet of tweets) {
    // Check if the author already exists in twitterHandles
    const [handle] = await db.insert(schema.twitterHandles)
      .values({
        id: BigInt(tweet.author.id),
        handle: tweet.author.handle,
        url: tweet.author.url,
        pfp: tweet.author.pfp,
        name: tweet.author.name,
        verified: tweet.author.verified,
        followers: tweet.author.followers,
      })
      .onConflictDoUpdate({
        target: schema.twitterHandles.id,
        set: {
          handle: tweet.author.handle,
          url: tweet.author.url,
          pfp: tweet.author.pfp,
          name: tweet.author.name,
          verified: tweet.author.verified,
          followers: tweet.author.followers,
          updated_at: new Date()
        }
      })
      .returning({ id: schema.twitterHandles.id });

    const handleId = handle.id;

    // Insert the tweet
    await db.insert(schema.tweets)
      .values({
        tweet_id: BigInt(tweet.tweet_id),
        handle_id: handleId,
        url: tweet.url,
        text: tweet.text,
        date: new Date(tweet.date),
        bookmark_count: tweet.bookmark_count,
        retweet_count: tweet.retweet_count,
        reply_count: tweet.reply_count,
        like_count: tweet.like_count,
        quote_count: tweet.quote_count,
        view_count: tweet.view_count,
        language: tweet.language,
        is_reply: tweet.is_reply,
        is_retweet: tweet.is_retweet,
        is_quote: tweet.is_quote,
        entities: tweet.entities,
      })
      .onConflictDoUpdate({
        target: schema.tweets.tweet_id,
        set: {
          text: tweet.text,
          bookmark_count: tweet.bookmark_count,
          retweet_count: tweet.retweet_count,
          reply_count: tweet.reply_count,
          like_count: tweet.like_count,
          quote_count: tweet.quote_count,
          view_count: tweet.view_count,
          entities: tweet.entities,
          updated_at: new Date(),
        },
      });
  }
}

export async function getTwitterHandles(): Promise<string[]> {
  const db = getDb();
  const handles = (await db.select({ handle: schema.twitterHandles.handle })
    .from(schema.twitterHandles)
    .where(isNull(schema.twitterHandles.deleted_at))).map(h => h.handle);

  return handles;
}

export async function getSomeTweets(): Promise<Omit<Tweet, 'author'>[]> {
  const db = getDb();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 5);
  const tweets = await db.select().from(schema.tweets).where(gte(schema.tweets.created_at, sevenDaysAgo));
  
  return tweets.map(tweet => ({
    ...tweet,
    date: tweet.date.toISOString(),
    tweet_id: tweet.tweet_id.toString(),
    entities: tweet.entities as TweetEntity
  }));
}

export async function addJobToDb(job: Job): Promise<void> {
  const db = getDb();
  await db.insert(jobs).values(job);
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
  const db = getDb();
  await db.update(jobs).set({ status, updated_at: new Date() }).where(eq(jobs.id, jobId));
}

export async function getJobById(jobId: string): Promise<Job | undefined> {
  const db = getDb();
  const result = await db.select().from(jobs).where(eq(jobs.id, jobId));
  return result[0];
}

export async function getNextPendingJob(): Promise<Job | undefined> {
  const db = getDb();
  const result = await db.select().from(jobs).where(eq(jobs.status, 'pending')).limit(1);
  return result[0];
}

export interface SaveSearchParams {
  userId: string;
  query: string;
  filters: SearchFilters;
}

export async function saveSearchToDb({ userId, query, filters }: SaveSearchParams): Promise<string> {
  const db = getDb();
  
  const [result] = await db.insert(searches)
    .values({
      user_id: userId,
      query,
      filters,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning({ id: searches.id });

  return result.id;
}
