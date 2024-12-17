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

export const getTweetSchema = {
  params: {
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
        found: { type: 'boolean' },
        data: {
          type: ['object', 'null'],
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            tweetId: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  },
} 