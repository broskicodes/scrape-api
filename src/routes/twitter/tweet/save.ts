import { FastifyPluginAsync } from 'fastify'
import { saveTweetSchema } from '../../../schemas/save'
import { saveTweet } from '../../../controllers/tweetSaveController'

const save: FastifyPluginAsync = async (fastify) => {
  fastify.post('/save', {
    schema: saveTweetSchema,
    handler: saveTweet,
  })
}

export default save
