import { TwitterScrapeType } from "./types";

export function getSinceDate(scrapeType: TwitterScrapeType): string {
    const now = new Date();
    let sinceDate: Date;
  
    switch (scrapeType) {
      case TwitterScrapeType.Initialize:
        sinceDate = new Date('2024-10-01T00:00:00Z');
        break;
      case TwitterScrapeType.Monthly:
        sinceDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        break;
      case TwitterScrapeType.Weekly:
        sinceDate = new Date(now);
        sinceDate.setUTCDate(now.getUTCDate() - now.getUTCDay() + 1); // Get the most recent Monday
        sinceDate.setUTCHours(0, 0, 0, 0);
        break;
      case TwitterScrapeType.Daily:
        sinceDate = new Date(now);
        sinceDate.setUTCHours(0, 0, 0, 0);
        break;
      default:
        throw new Error('Invalid scrape type');
    }
  
    // Format as YYYY-MM-DD_HH:mm:ss_UTC
    return sinceDate.toISOString().replace('T', '_').replace(/\.\d{3}Z$/, '_UTC');
  }
  