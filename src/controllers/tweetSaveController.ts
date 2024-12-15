import { FastifyReply, FastifyRequest } from 'fastify'
import { TweetSaveService } from '../services/tweetSaveService'

interface SaveTweetBody {
  tweetId: string
  userId: string
}

export async function saveTweet(
  request: FastifyRequest<{ Body: SaveTweetBody }>,
  reply: FastifyReply
) {
  try {
    const { tweetId, userId } = request.body
    await TweetSaveService.saveTweet({ userId, tweetId })
    
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