
export enum TwitterScrapeType {
    Initialize = "initialize",
    Monthly = "monthly",
    Weekly = "weekly",
    Daily = "daily"
  }
  
  export interface TwitterAuthor {
    id: string;
    handle: string;
    pfp: string;
    url: string;
  }
  
  export interface Tweet {
    tweet_id: string;
    author: TwitterAuthor;
    url: string;
    date: string;
    bookmark_count: number;
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    view_count: number;
  }