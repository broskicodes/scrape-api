import { FastifyReply, FastifyRequest } from 'fastify'
import { TweetSaveService } from '../services/tweetSaveService'

interface SaveTweetBody {
  tweetId: string
  userId: string
  author: string
}

interface GetTweetParams {
  tweetId: string
  userId: string
}

export async function saveTweet(
  request: FastifyRequest<{ Body: SaveTweetBody }>,
  reply: FastifyReply
) {
  try {
    const { tweetId, userId, author } = request.body
    await TweetSaveService.saveTweet({ userId, tweetId, author })
    
    return reply.send({
      success: true,
      message: 'Tweet saved successfully',
    })
  } catch (error) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      message: 'Failed to save tweet',
    })
  }
}

export async function getTweet(
  request: FastifyRequest<{ Params: GetTweetParams }>,
  reply: FastifyReply
) {
  try {
    const { tweetId, userId } = request.params
    const result = await TweetSaveService.getTweet({ userId, tweetId })
    
    return reply.send(result)
  } catch (error) {
    request.log.error(error)
    return reply.status(500).send({
      found: false,
      message: 'Failed to get tweet'
    })
  }
} 