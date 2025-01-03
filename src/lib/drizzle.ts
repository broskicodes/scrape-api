import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from './db-schema';
import { desc, eq, gte, isNull, and, sql, lte } from 'drizzle-orm';
import { Job, JobStatus, Tweet, SearchFilters, TweetEntity, TwitterAuthor, Draft, TweetDraftStatus } from './types';
import { jobs, savedTweets, searches, subscriptions, users } from './db-schema';
import { chunkArray } from "./utils";

let pool: Pool | null = null;

// Function to get or create Pool
function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables');
  }
  
  if (!pool) {
    pool = new Pool({
      max: 20,
      connectionString: process.env.DATABASE_URL,
    });
  }
  
  return pool;
}

// Function to get or create db
export function getDb() {
  const pool = getPool();
  return drizzle(pool, { schema });
}

export async function createUser(
  twitterHandleId: string,
  name: string,
  twitterHandle: string,
  twitterHandleVerified: boolean,
  accessToken?: string,
  refreshToken?: string,
  expiresIn?: number
) {
  const db = getDb();

  await db.insert(schema.twitterHandles).values({ 
    id: BigInt(twitterHandleId),
    handle: twitterHandle,
    url: `https://x.com/${twitterHandle}`,
    pfp: `https://unavatar.io/twitter/${twitterHandle}`,
    name: name,
    verified: twitterHandleVerified,
    created_at: new Date(),
    updated_at: new Date()
  }).onConflictDoUpdate({
    target: schema.twitterHandles.id,
    set: {
      handle: twitterHandle,
      url: `https://x.com/${twitterHandle}`,
      pfp: `https://unavatar.io/twitter/${twitterHandle}`,
      name: name,
      verified: twitterHandleVerified,
      updated_at: new Date()
    }
  });
  
  const [{ id }] = await db.insert(users).values({ 
    name, 
    email: "",
    twitter_handle_id: BigInt(twitterHandleId),
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    created_at: new Date(), 
    updated_at: new Date() 
  }).onConflictDoUpdate({
    target: users.twitter_handle_id,
    set: {
      name,
      twitter_handle_id: BigInt(twitterHandleId),
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      updated_at: new Date()
    }
  }).returning({ id: users.id });

  return id;
}

export async function getUser(userId: string) {
  const db = getDb();
  return await db.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function getUserSubscribed(userId: string) {
  const db = getDb();
  const subscription = await db.query.subscriptions.findFirst({ where: and(eq(subscriptions.user_id, userId), eq(subscriptions.active, true)) });

  return subscription !== undefined;
}

export async function addHandlesToDb(handles: TwitterAuthor[]) {
  const db = getDb();
  for (const handle of handles) {
    await db.insert(schema.twitterHandles).values({
      id: BigInt(handle.id),
      handle: handle.handle,
      url: handle.url,
      pfp: handle.pfp,
      name: handle.name,
      verified: handle.verified,
    }).onConflictDoUpdate({
      target: schema.twitterHandles.id,
      set: {
        handle: handle.handle,
        url: handle.url,
        pfp: handle.pfp,
        name: handle.name,
        verified: handle.verified,
        updated_at: new Date()
      }
    });

    await db.insert(schema.twitterFollowers)
      .values({
        handle_id: BigInt(handle.id),
        followers: handle.followers!,
        created_at: new Date(),
        updated_at: new Date()
      });
  }
}

export async function addTweetsToDb(tweets: Tweet[]) {
  const db = getDb();

  // const searchTerms: string[] = [];

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
        description: tweet.author.description,
      })
      .onConflictDoUpdate({
        target: schema.twitterHandles.id,
        set: {
          handle: tweet.author.handle,
          url: tweet.author.url,
          pfp: tweet.author.pfp,
          name: tweet.author.name,
          verified: tweet.author.verified,
          description: tweet.author.description,
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

    // if (tweet.thread_id) {
    //   searchTerms.push(`from:${tweet.author.handle} filter:self_threads conversation_id:${tweet.tweet_id}`);
    // }
  }

  // if (searchTerms.length > 0) {
  //   const batches = chunkArray(searchTerms, 100);

  //   for (const batch of batches) {
  //     await addJobToDb({
  //       id: crypto.randomUUID(),
  //       status: 'pending',
  //       type: 'thread_import',
  //       params: JSON.stringify({ input: { searchTerms: batch }, env: process.env.ENVIRONMENT }),
  //       created_at: new Date(),
  //       updated_at: new Date(),
  //     });
  //   }
  // }
}

export async function addThreadsToDb(tweets: Tweet[]) {
  const db = getDb();

  const threadIds = new Set<string>();
  for (const tweet of tweets) {
    if (!tweet.thread_id) {
      continue;
    }

    if (!threadIds.has(tweet.thread_id)) {
      threadIds.add(tweet.thread_id);

      await db.update(schema.tweets).set({ is_thread: true }).where(eq(schema.tweets.tweet_id, BigInt(tweet.thread_id)));
    }

    await db.insert(schema.threads).values({
      tweet_id: BigInt(tweet.tweet_id),
      parent_tweet_id: BigInt(tweet.thread_id),
      url: tweet.url,
      text: tweet.text,
      date: new Date(tweet.date),
    }).onConflictDoNothing();
  }
}

export async function addTweetersToDb(tweeters: TwitterAuthor[]) {
  const db = getDb();

  for (const tweeter of tweeters) {
    await db.update(schema.twitterHandles)
      .set({
        handle: tweeter.handle,
        url: tweeter.url,
        pfp: tweeter.pfp,
        name: tweeter.name,
        verified: tweeter.verified,
        description: tweeter.description,
        updated_at: new Date()
      })
      .where(eq(schema.twitterHandles.id, BigInt(tweeter.id)));

    await db.insert(schema.twitterFollowers)
      .values({
        handle_id: BigInt(tweeter.id),
        followers: tweeter.followers!,
        created_at: new Date(),
        updated_at: new Date()
      });
  }
}

export async function getHandleForSubscribedUsers(): Promise<string[]> {
  const db = getDb();
  const handles = await db
    .select({ handle: schema.twitterHandles.handle })
    .from(schema.twitterHandles)
    .innerJoin(schema.users, eq(schema.users.twitter_handle_id, schema.twitterHandles.id))
    .innerJoin(schema.subscriptions, eq(schema.subscriptions.user_id, schema.users.id))
    .where(
      and(
        isNull(schema.users.deleted_at),
        eq(schema.subscriptions.active, true)
      )
    );

  return handles.map(h => h.handle);
}

export async function getTwitterHandlesWithProfiles(): Promise<string[]> {
  const db = getDb();
  const handles = await db.select({ handle: schema.twitterHandles.handle })
    .from(schema.twitterHandles)
    .innerJoin(schema.profiles, eq(schema.profiles.handle_id, schema.twitterHandles.id))
    .where(isNull(schema.twitterHandles.deleted_at));

  return handles.map(h => h.handle);
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
  const result = await db.select().from(jobs).where(
    and(
      eq(jobs.status, 'pending'),
      sql`${jobs.params}::text LIKE ${`%${process.env.ENVIRONMENT}%`}`
    )
  ).limit(1);

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

export async function getNextScheduledPost(): Promise<Draft | undefined> {
  const db = getDb();
  const result = await db.select().from(schema.tweetDrafts).where(
    and(
      eq(schema.tweetDrafts.status, 'scheduled'),
      lte(schema.tweetDrafts.scheduled_for, new Date())
    )
  ).limit(1);

  return result[0] as Draft;
}

export async function getDraftById(draftId: string): Promise<Draft | undefined> {
  const db = getDb();
  const result = await db.select().from(schema.tweetDrafts).where(eq(schema.tweetDrafts.id, draftId));
  return result[0] as Draft;
}

export async function updateDraftStatus(draftId: string, status: TweetDraftStatus) {
  const db = getDb();
  await db.update(schema.tweetDrafts).set({ status, updated_at: new Date() }).where(eq(schema.tweetDrafts.id, draftId));
}

export async function setDraftPosted(draftId: string) {
  const db = getDb();
  await db.update(schema.tweetDrafts).set({ status: 'posted', posted_at: new Date(), updated_at: new Date() }).where(eq(schema.tweetDrafts.id, draftId));
}

export async function getSavedTweetById(userId: string, tweetId: string): Promise<any> {
  const db = getDb();
  const result = await db.select().from(savedTweets).where(and(eq(savedTweets.user_id, userId), eq(savedTweets.tweet_id, BigInt(tweetId))));
  return result[0];
}

export async function saveTweet(tweetId: string, userId: string, author: string) {
  const db = getDb();
  await db.insert(savedTweets).values({ user_id: userId, tweet_id: BigInt(tweetId), author });
}

export async function deleteSavedTweet(userId: string, tweetId: string) {
  const db = getDb();
  await db.delete(savedTweets).where(and(eq(savedTweets.user_id, userId), eq(savedTweets.tweet_id, BigInt(tweetId))));
}