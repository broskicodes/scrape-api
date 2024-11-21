export const twitterUsersSchema = {
  body: {
    type: 'object',
    required: ['handles'],
    properties: {
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
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        users: { type: 'array', items: { type: 'object' } }
      },
      required: ['success', 'users']
    }
  }
}; 