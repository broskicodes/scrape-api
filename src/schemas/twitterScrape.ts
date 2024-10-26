import { TwitterScrapeType } from '../lib/types';

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
      type: 'object',
      properties: {
        message: { type: 'string' },
        jobId: { type: 'string' }
      },
      required: ['message', 'jobId']
    }
  }
};
