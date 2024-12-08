import { parentPort, workerData } from 'worker_threads';
import { TwitterScraperService } from '../services/twitterScraperService';
import { ClientMessagePayload, ClientMessageType, FollowersPayload, ScrapePayload, UsersPayload } from '../plugins/websocket';
import { TwitterUsersService } from '../services/twitterUsersService';
import { getSinceDate } from '../lib/utils';
import { TwitterScrapeType } from '../lib/types';

parentPort?.on('message', async ({ type, payload }: { type: ClientMessageType, payload: ClientMessagePayload }) => {
    switch (type) {
        case ClientMessageType.Scrape: {
            const { scrapeType, handles } = payload as ScrapePayload;
            const scraper = new TwitterScraperService();
            const result = await scraper.runScrapeJob(scrapeType, handles);
            parentPort?.postMessage(result);
            break;
        }
        case ClientMessageType.Followers: {
            console.log('Received followers request');
            const { handle } = payload as FollowersPayload;
            const followersService = new TwitterUsersService();
            const followers = (await followersService.getFollowersForHandle(handle)).sort((a, b) => b.followers - a.followers);

            const scraper = new TwitterScraperService();
            const result = await scraper.runScrapeJob({ 
                input: { 
                    searchTerms: followers.slice(0, 10).map(follower => {
                        const sinceDate = getSinceDate(TwitterScrapeType.Weekly);
                        return [
                            `from:${follower.handle} since:${sinceDate} filter:replies`,
                            `from:${follower.handle} since:${sinceDate} filter:quote`,
                            `from:${follower.handle} since:${sinceDate} filter:nativeretweets`,
                        ];
                    }).flat(),
                    sort: "Top",
                    tweetLanguage: "en",
                    maxItems: 50
                 } 
            });


            parentPort?.postMessage(result);
            break;
        }
        case ClientMessageType.Users: {
            const { handles } = payload as UsersPayload;
            const usersService = new TwitterUsersService();
            const result = await usersService.importUsers(handles);
            parentPort?.postMessage(result);
            break;
        }
    }
});
