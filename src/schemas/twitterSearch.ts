export interface SearchFilters {
  verified?: boolean;
  mediaOnly?: boolean;
  linksOnly?: boolean;
  quoteTweetsOnly?: boolean;
  threadOnly?: boolean;
  minLikes?: string;
  minComments?: string;
  minRetweets?: string;
  dateRange?: '24h' | '7d' | '28d';
}

export const twitterSearchSchema = {
  body: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string' },
      filters: {
        type: 'object',
        properties: {
          verified: { type: 'boolean' },
          mediaOnly: { type: 'boolean' },
          linksOnly: { type: 'boolean' },
          quoteTweetsOnly: { type: 'boolean' },
          threadOnly: { type: 'boolean' },
          minLikes: { type: 'string' },
          minComments: { type: 'string' },
          minRetweets: { type: 'string' },
          dateRange: {
            type: 'string',
            enum: ['24h', '7d', '28d']
          }
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tweet_id: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  handle: { type: 'string' },
                  pfp: { type: 'string' },
                  url: { type: 'string' },
                  verified: { type: 'boolean' }
                }
              },
              url: { type: 'string' },
              text: { type: 'string' },
              date: { type: 'string' },
              bookmark_count: { type: 'number' },
              retweet_count: { type: 'number' },
              reply_count: { type: 'number' },
              like_count: { type: 'number' },
              quote_count: { type: 'number' },
              view_count: { type: 'number' },
              language: { type: 'string' },
              is_reply: { type: 'boolean' },
              is_retweet: { type: 'boolean' },
              is_quote: { type: 'boolean' }
            },
            required: [
              'tweet_id',
              'author',
              'url',
              'text',
              'date',
              'bookmark_count',
              'retweet_count',
              'reply_count',
              'like_count',
              'quote_count',
              'view_count',
              'language',
              'is_reply',
              'is_retweet',
              'is_quote'
            ]
          }
        }
      },
      required: ['success', 'results']
    }
  }
}; 