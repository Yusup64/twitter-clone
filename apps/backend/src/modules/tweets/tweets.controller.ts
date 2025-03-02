import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TweetsService } from './tweets.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';
import { UserAuth } from '@/src/common/decorators/user.decorator';
import { CreateTweetDto, UpdateTweetDto, CreatePollDto } from './dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsPublic, Roles } from '@/src/common/decorators';
import { Role } from '@/src/common/enums/role.enum';

@ApiTags('tweets')
@Controller('tweets')
@UseGuards(JwtAuthGuard)
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  @Post()
  create(@UserAuth() user, @Body() createTweetDto: CreateTweetDto) {
    return this.tweetsService.create(user.id, createTweetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tweets' })
  @IsPublic()
  findAll(@Query() query) {
    return this.tweetsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tweet by id' })
  @IsPublic()
  findOne(@Param('id') id: string) {
    return this.tweetsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tweet by id' })
  update(
    @UserAuth() user,
    @Param('id') id: string,
    @Body() updateTweetDto: UpdateTweetDto,
  ) {
    return this.tweetsService.update(user.id, id, updateTweetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tweet' })
  @UseGuards(JwtAuthGuard)
  async deleteTweet(@UserAuth() user, @Param('id') tweetId: string) {
    return this.tweetsService.deleteTweet(user.id, tweetId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a tweet by id' })
  like(@UserAuth() user, @Param('id') tweetId: string) {
    return this.tweetsService.likeTweet(user.id, tweetId);
  }

  @Post(':id/retweet')
  @ApiOperation({ summary: 'Retweet a tweet by id' })
  retweet(@UserAuth() user, @Param('id') tweetId: string) {
    return this.tweetsService.retweet(user.id, tweetId);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Add comment to tweet' })
  addComment(
    @UserAuth() user,
    @Param('id') tweetId: string,
    @Body('content') content: string,
  ) {
    return this.tweetsService.addComment(user.id, tweetId, content);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get user timeline' })
  getTimeline(@UserAuth() user, @Query() query) {
    return this.tweetsService.getTimeline(user.id, query);
  }

  @Post('with-poll')
  @ApiOperation({ summary: 'Create tweet with poll' })
  createTweetWithPoll(
    @UserAuth() user,
    @Body() createTweetDto: CreateTweetDto,
    @Body('poll') createPollDto: CreatePollDto,
  ) {
    return this.tweetsService.createWithPoll(
      user.id,
      createTweetDto,
      createPollDto,
    );
  }

  @Post('poll/:id/vote')
  @ApiOperation({ summary: 'Vote on a poll' })
  votePoll(
    @UserAuth() user,
    @Param('id') pollId: string,
    @Body('optionIndex') optionIndex: number,
  ) {
    return this.tweetsService.votePoll(user.id, pollId, optionIndex);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tweets' })
  @IsPublic()
  async searchTweets(
    @Query('query') query: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.tweetsService.searchTweets(query, limit);
  }

  @Get('hashtags/search')
  @ApiOperation({ summary: 'Search hashtags' })
  @IsPublic()
  async searchHashtags(
    @Query('query') query: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.tweetsService.searchHashtags(query, parseInt(limit));
  }

  @Get('hashtags/:hashtag')
  @ApiOperation({ summary: 'Get tweets by hashtag' })
  @IsPublic()
  async getTweetsByHashtag(@Param('hashtag') hashtag: string, @Query() query) {
    return this.tweetsService.getTweetsByHashtag(hashtag, query);
  }

  @Get('cache/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getCacheStats() {
    return this.tweetsService.getCacheStats();
  }
}
