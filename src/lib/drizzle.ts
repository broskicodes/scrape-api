import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from './db-schema';
import { eq, isNull } from 'drizzle-orm';
import { Job, JobStatus, Tweet } from './types';
import { jobs } from './db-schema';

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
    const existingHandle = await db.select()
      .from(schema.twitterHandles)
      .where(eq(schema.twitterHandles.id, BigInt(tweet.author.id)))
      .limit(1);

    let handleId: bigint;

    if (existingHandle.length === 0) {
      // Author doesn't exist, add them to twitterHandles
      const [newHandle] = await db.insert(schema.twitterHandles)
        .values({
          id: BigInt(tweet.author.id),
          handle: tweet.author.handle,
          url: tweet.author.url,
          pfp: tweet.author.pfp,
        })
        .returning({ id: schema.twitterHandles.id });

      handleId = newHandle.id;
    } else {
      handleId = existingHandle[0].id;
    }

    // Insert the tweet
    await db.insert(schema.tweets)
      .values({
        tweet_id: BigInt(tweet.tweet_id),
        handle_id: handleId,
        url: tweet.url,
        date: new Date(tweet.date),
        bookmark_count: tweet.bookmark_count,
        retweet_count: tweet.retweet_count,
        reply_count: tweet.reply_count,
        like_count: tweet.like_count,
        quote_count: tweet.quote_count,
        view_count: tweet.view_count,
      })
      .onConflictDoUpdate({
        target: schema.tweets.tweet_id,
        set: {
          bookmark_count: tweet.bookmark_count,
          retweet_count: tweet.retweet_count,
          reply_count: tweet.reply_count,
          like_count: tweet.like_count,
          quote_count: tweet.quote_count,
          view_count: tweet.view_count,
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
