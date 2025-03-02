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

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: 'Get user bookmarks' })
  getBookmarks(@UserAuth('id') userId: string) {
    return this.bookmarksService.getBookmarks(userId);
  }

  @Post(':tweetId')
  @ApiOperation({ summary: 'Add a tweet to bookmarks' })
  addBookmark(
    @UserAuth('id') userId: string,
    @Param('tweetId') tweetId: string,
  ) {
    return this.bookmarksService.addBookmark(userId, tweetId);
  }

  @Delete(':tweetId')
  @ApiOperation({ summary: 'Remove a tweet from bookmarks' })
  removeBookmark(
    @UserAuth('id') userId: string,
    @Param('tweetId') tweetId: string,
  ) {
    return this.bookmarksService.removeBookmark(userId, tweetId);
  }
}
