import { getDraftById, updateDraftStatus, getUser, getUserSubscribed, setDraftPosted } from "../lib/drizzle";
import { TwitterApi } from "twitter-api-v2";
import { TweetBox } from "../lib/types";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
type MediaIds =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string];

export class DraftPostService {
    private async createTwitterClient(userId: string) {
        const user = await getUser(userId);
      
        if (!user?.oauth_token) {
          throw new Error("No Twitter access token found");
        }
      
        return new TwitterApi({
          appKey: process.env.TWITTER_API_KEY!,
          appSecret: process.env.TWITTER_API_SECRET_KEY!,
          accessToken: user.oauth_token!,
          accessSecret: user.oauth_token_secret!,
        });
      }

    async postDraft(draftId: string) {
        const draft = await getDraftById(draftId);
        
        if (!draft) {
        console.error(`Draft with ID ${draftId} not found`);
        return;
        }

        if (draft.status !== 'scheduled') {
        console.log(`Draft ${draftId} is not scheduled, skipping`);
        return;
        }

        await updateDraftStatus(draftId, 'posting');
        
        const twitterClient = await this.createTwitterClient(draft.user_id);
        const tweetBoxes = draft.tweet_boxes as TweetBox[];

        // 2. Process each tweet box and upload media if present
        const processedTweets = await Promise.all(
          tweetBoxes.map(async (tweetBox) => {
            if (!tweetBox.media?.length) {
              return { text: tweetBox.content };
            }
    
            // Upload each media item and get media IDs
            const mediaIds = await Promise.all(
              tweetBox.media.slice(0, 4).map(async (mediaItem) => {
                const command = new GetObjectCommand({
                  Bucket: process.env.AWS_BUCKET_NAME!,
                  Key: mediaItem.s3Key,
                });
    
                const file = await s3Client.send(command);
    
                const buffer = await file.Body?.transformToByteArray();
    
                if (!buffer) {
                  throw new Error("No buffer");
                }
    
                try {
                  const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(buffer), {
                    mimeType: file.ContentType,
                    target: "tweet",
                    shared: false,
                  });
    
                  return mediaId;
                } catch (error) {
                  // Log the detailed error
                  console.error("Twitter media upload failed:", {
                    error,
                    fileType: file.ContentType,
                    fileSize: file.ContentLength,
                  });
                  throw error;
                }
              }),
            );
    
            return {
              text: tweetBox.content,
              media: { media_ids: mediaIds as MediaIds },
            };
          }),
        );

        const subscribed = await getUserSubscribed(draft.user_id);
    
        if (!subscribed) {
          processedTweets.push({
            text: `This tweet was posted using Tweet Maestro: https://tweetmaestro.com`,
          });
        }
    
        // 3. Post the thread with media
        await twitterClient.v2.tweetThread(processedTweets);
        await setDraftPosted(draftId);

        console.log(`Draft ${draftId} posted`);
    }
}