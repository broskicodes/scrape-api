import { FastifyPluginAsync } from 'fastify'
import { saveTweetSchema, getTweetSchema } from '../../../schemas/savedTweets'
import { saveTweet, getTweet } from '../../../controllers/tweetSaveController'

const save: FastifyPluginAsync = async (fastify) => {
  fastify.post('/save', {
    schema: saveTweetSchema,
    handler: saveTweet,
  })

  fastify.get('/:userId/:tweetId', {
    schema: getTweetSchema,
    handler: getTweet,
  })
}

export default save
