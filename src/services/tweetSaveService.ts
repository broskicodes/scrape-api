import { saveTweet, deleteSavedTweet, getSavedTweetById } from '../lib/drizzle'

interface SaveTweetParams {
  userId: string
  tweetId: string
}

interface GetTweetParams {
  userId: string
  tweetId: string
}

export class TweetSaveService {
  static async saveTweet({ userId, tweetId }: SaveTweetParams): Promise<void> {

    console.log('Saving tweet:', tweetId, userId);
    try {
      await saveTweet(tweetId, userId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log('Duplicate key error, deleting saved tweet');
        await deleteSavedTweet(userId, tweetId);
        return;
      }
      throw error;
    }
  }

  static async getTweet({ userId, tweetId }: GetTweetParams) {
    const tweet = await getSavedTweetById(userId, tweetId)
    return {
      found: !!tweet,
      data: tweet
    }
  }
} 