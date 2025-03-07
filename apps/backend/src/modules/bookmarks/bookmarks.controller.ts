import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@/src/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { BookmarksService } from './bookmarks.service';

/**
 * Controller to manage user bookmarks.
 * Uses JWT authentication to ensure only authorized users can access bookmark functionalities.
 */
@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  /**
   * Retrieves all bookmarks of the authenticated user.
   * 
   * @param userId - Extracted from the authenticated user.
   * @returns A list of bookmarked tweets.
   */
  @Get()
  @ApiOperation({ summary: 'Get user bookmarks' })
  getBookmarks(@UserAuth('id') userId: string) {
    return this.bookmarksService.getBookmarks(userId);
  }

  /**
   * Adds a tweet to the user's bookmarks.
   * 
   * @param userId - Extracted from the authenticated user.
   * @param tweetId - The ID of the tweet to be bookmarked.
   * @returns The newly created bookmark entry.
   */
  @Post(':tweetId')
  @ApiOperation({ summary: 'Add a tweet to bookmarks' })
  addBookmark(
    @UserAuth('id') userId: string,
    @Param('tweetId') tweetId: string,
  ) {
    return this.bookmarksService.addBookmark(userId, tweetId);
  }

  /**
   * Removes a tweet from the user's bookmarks.
   * 
   * @param userId - Extracted from the authenticated user.
   * @param tweetId - The ID of the tweet to be removed from bookmarks.
   * @returns The deleted bookmark entry.
   */
  @Delete(':tweetId')
  @ApiOperation({ summary: 'Remove a tweet from bookmarks' })
  removeBookmark(
    @UserAuth('id') userId: string,
    @Param('tweetId') tweetId: string,
  ) {
    return this.bookmarksService.removeBookmark(userId, tweetId);
  }
}
