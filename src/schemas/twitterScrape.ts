import { TwitterScrapeType, Tweet } from '../lib/types';

export const twitterScrapeSchema = {
  body: {
    type: 'object',
    required: ['scrapeType', 'handles'],
    properties: {
      scrapeType: {
        type: 'string',
        enum: Object.values(TwitterScrapeType)
      },
      handles: {
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 1
      }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tweet_id: { type: 'string' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              handle: { type: 'string' },
              pfp: { type: 'string' },
              url: { type: 'string' }
            }
          },
          url: { type: 'string' },
          date: { type: 'string' },
          bookmark_count: { type: 'number' },
          retweet_count: { type: 'number' },
          reply_count: { type: 'number' },
          like_count: { type: 'number' },
          quote_count: { type: 'number' },
          view_count: { type: 'number' }
        }
      }
    }
  }
};
