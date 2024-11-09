import { TwitterUsersService } from '../services/twitterUsersService';

export class TwitterUsersController {
  private twitterUsersService: TwitterUsersService;

  constructor() {
    this.twitterUsersService = new TwitterUsersService();
  }

  async importUsers(handles: string[]) {
    try {
      const users = await this.twitterUsersService.importUsers(handles);
      return {
        success: true,
        users
      };
    } catch (error) {
      console.error('Error in importUsers controller:', error);
      throw error;
    }
  }
} 