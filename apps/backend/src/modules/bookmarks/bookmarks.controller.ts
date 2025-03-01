import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@/src/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { BookmarksService } from './bookmarks.service';

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  getBookmarks(@UserAuth('id') userId: string) {
    return this.bookmarksService.getBookmarks(userId);
  }

  @Post(':tweetId')
  addBookmark(
    @UserAuth('id') userId: string,
    @Param('tweetId') tweetId: string,
  ) {
    return this.bookmarksService.addBookmark(userId, tweetId);
  }

  @Delete(':tweetId')
  removeBookmark(
    @UserAuth('id') userId: string,
    @Param('tweetId') tweetId: string,
  ) {
    return this.bookmarksService.removeBookmark(userId, tweetId);
  }
}
