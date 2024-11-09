import { desc, ilike } from "drizzle-orm";
import { addHandlesToDb, getDb } from "../lib/drizzle";
import { twitterHandles } from "../lib/db-schema";
import { runApifyActor } from '../lib/apify';
import { APIFY_TWITTER_USER_ACTOR } from '../lib/constant';

export class TwitterUsersService {
  

  async importUsers(handles: string[]) {
    try {      
      const input = {
        "getFollowers": false,
        "getFollowing": false,
        "getRetweeters": false,
        "includeUnavailableUsers": false,
        // "maxItems": 10000,
        "twitterHandles": handles
      }

      const result = await runApifyActor(APIFY_TWITTER_USER_ACTOR, input);
      
      const users = result
        .filter((user: any) => user.isVerified || user.followers >= 3000)
        .map((user: any) => ({
          id: user.id,
          handle: user.userName,
          name: user.name,
          verified: user.isVerified,
          url: user.url,
          description: user.description,
          pfp: user.profilePicture,
          followers: user.followers
        }));

      await addHandlesToDb(users);
    
      console.log(users.length);

      return users;
    } catch (error) {
      console.error('Error in importUsers service:', error);
      throw error;
    }
  }
} 