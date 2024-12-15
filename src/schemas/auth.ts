export const twitterCallbackSchema = {
  querystring: {
    type: 'object',
    required: ['code', 'state'],
    properties: {
      code: { type: 'string' },
      state: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'string',
      description: 'HTML page with chrome message script'
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      },
      required: ['success', 'message']
    }
  }
}

export const twitterLoginSchema = {
  querystring: {
    type: 'object',
    required: ['state'],
    properties: {
      state: { type: 'string' }
    }
  },
  response: {
    302: {
      type: 'null',
      description: 'Redirect to Twitter OAuth page'
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      },
      required: ['success', 'message']
    }
  }
} 