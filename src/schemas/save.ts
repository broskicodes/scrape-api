export const saveTweetSchema = {
  body: {
    type: 'object',
    required: ['tweetId', 'userId'],
    properties: {
      tweetId: { type: 'string' },
      userId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
} 