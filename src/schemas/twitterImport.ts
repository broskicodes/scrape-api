export const twitterImportSchema = {
  body: {
    type: 'object',
    required: ['urls'],
    properties: {
      urls: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        tweets: {
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
            }
          }
        }
      },
      required: ['success', 'tweets']
    }
  }
}; 