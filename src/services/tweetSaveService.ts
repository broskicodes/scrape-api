import { saveTweet } from '../lib/drizzle'

interface SaveTweetParams {
  userId: string
  tweetId: string
}

export class TweetSaveService {
  static async saveTweet({ userId, tweetId }: SaveTweetParams): Promise<void> {
    console.log('Saving tweet:', tweetId, userId);
    // await saveTweet(tweetId, userId);
  }
} 