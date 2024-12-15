import { FastifyPluginAsync } from 'fastify'
import { twitterLoginSchema } from '../../../schemas/auth'
import crypto from 'crypto'
import TwitterApi from 'twitter-api-v2'

const login: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: twitterLoginSchema,
    handler: async (request, reply) => {
      try {
        const { state } = request.query as { state?: string }
        
        if (!state) {
          throw new Error('State parameter is required')
        }

        const twitterClient = new TwitterApi({
          clientId: process.env.TWITTER_CLIENT_ID!,
          clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        })

        const { url, codeVerifier } = twitterClient.generateOAuth2AuthLink(process.env.TWITTER_CALLBACK_URL!, {
          scope: ['tweet.read', 'users.read', 'bookmark.read', 'offline.access'],
          state,
          
        })

        console.log('url', codeVerifier)
        fastify.twitterCodeVerifiers.set(state, codeVerifier)

        return reply.redirect(url)

      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Failed to initiate Twitter login'
        })
      }
    }
  })
}

export default login 