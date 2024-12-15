import { FastifyPluginAsync } from 'fastify'
import { twitterCallbackSchema } from '../../../schemas/auth'
import TwitterApi from 'twitter-api-v2'
import { createUser } from '../../../lib/drizzle'

const callback: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { code: string, state: string } }>('/', {
    schema: twitterCallbackSchema,
    handler: async (request, reply) => {
      try {
        const { code, state } = request.query

        const codeVerifier = fastify.twitterCodeVerifiers.get(state)
        if (!codeVerifier) {
          throw new Error('Invalid state')
        }

        fastify.twitterCodeVerifiers.delete(state)

        const twitterClient = new TwitterApi({
          clientId: process.env.TWITTER_CLIENT_ID!,
          clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        })

        const { client, accessToken, refreshToken, expiresIn } = await twitterClient.loginWithOAuth2({
          code,
          redirectUri: process.env.TWITTER_CALLBACK_URL!,
          codeVerifier: codeVerifier,
        })

        const user = await client.currentUserV2()
        const userId = await createUser(user.data.id, user.data.name, user.data.username, user.data.verified ?? false, accessToken, refreshToken, expiresIn)

        const html = `
          <script>
            chrome.runtime.sendMessage('${process.env.CHROME_EXTENSION_ID}', {
              type: 'oauth_callback',
              payload: {
                user_id: '${userId}',
                state: '${state}'
              }
            });
          </script>
        `

        reply.type('text/html')
        return reply.send(html)

      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'OAuth callback failed'
        })
      }
    }
  })
}

export default callback 