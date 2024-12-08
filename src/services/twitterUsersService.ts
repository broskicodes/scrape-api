import { desc, ilike } from "drizzle-orm";
import { addHandlesToDb, getDb } from "../lib/drizzle";
import { twitterHandles } from "../lib/db-schema";
import { runApifyActor } from '../lib/apify';
import { APIFY_TWITTER_USER_ACTOR } from '../lib/constant';

export class TwitterUsersService {
  async getFollowersForHandle(handle: string) {
    const input = {
      "getFollowers": true,
      "getFollowing": false,
      "getRetweeters": false,
      "includeUnavailableUsers": false,
      "maxItems": 500,
      "twitterHandles": [handle]
    }

    const result = await runApifyActor(APIFY_TWITTER_USER_ACTOR, input);

    const users = result
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

    return users.filter((user) => user.handle !== handle);
  }

  async importUsers(handles: string[]) {
    try {      
      const input = {
        "getFollowers": false,
        "getFollowing": false,
        "getRetweeters": false,
        "includeUnavailableUsers": false,
        "maxItems": 2000,
        "twitterHandles": handles.length >= 5 ? handles : Array(5).fill(handles).flat()
      }

      const result = await runApifyActor(APIFY_TWITTER_USER_ACTOR, input);
      
      const users = result
        // .filter((user: any) => user.isVerified || user.followers >= 3000)
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

      const uniqueUsers = users.filter((user, index, self) =>
        index === self.findIndex((u) => u.handle === user.handle)
      );
      // await addHandlesToDb(uniqueUsers);
    
      console.log(users.length);

      return users;
    } catch (error) {
      console.error('Error in importUsers service:', error);
      throw error;
    }
  }
} 