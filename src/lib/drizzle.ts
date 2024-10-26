import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from './db-schema';
import { eq } from 'drizzle-orm';
import { Tweet } from './types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function addTweetsToDb(tweets: Tweet[]) {
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
