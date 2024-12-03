import { parentPort, workerData } from 'worker_threads';
import { TwitterScraperService } from '../services/twitterScraperService';

parentPort?.on('message', async ({ scrapeType, handles }) => {
  const scraper = new TwitterScraperService();
  const result = await scraper.runScrapeJob(scrapeType, handles);
  parentPort?.postMessage(result);
});