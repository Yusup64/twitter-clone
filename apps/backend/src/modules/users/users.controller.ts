import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { UserAuth } from '@/src/common/decorators/user.decorator';
import { IsPublic } from '@/src/common/decorators';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/getByUsername/:username')
  @ApiOperation({ summary: 'Get user profile' })
  @IsPublic()
  async getUserProfile(@Param('username') username: string, @UserAuth() user) {
    return this.usersService.getUserProfile(username, user?.id);
  }

  @Get(':username/tweets')
  @ApiOperation({ summary: 'Get user tweets' })
  @IsPublic()
  getUserTweets(
    @Param('username') username: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getUserTweets(username, page, limit);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow user' })
  @ApiBearerAuth('access-token')
  followUser(@UserAuth() user, @Param('id') followingId: string) {
    return this.usersService.followUser(user.id, followingId);
  }

  @Post(':id/unfollow')
  @ApiOperation({ summary: 'Unfollow user' })
  @ApiBearerAuth('access-token')
  unfollowUser(@UserAuth() user, @Param('id') followingId: string) {
    return this.usersService.unfollowUser(user.id, followingId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiBearerAuth('access-token')
  @IsPublic()
  getUserFollowers(@Param('id') userId: string, @Query() query) {
    return this.usersService.getUserFollowers(userId, query);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get user following' })
  @ApiBearerAuth('access-token')
  @IsPublic()
  getUserFollowing(@Param('id') userId: string, @Query() query) {
    return this.usersService.getUserFollowing(userId, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiBearerAuth('access-token')
  @IsPublic()
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.usersService.searchUsers(query, parseInt(limit));
  }

  @Get('suggested')
  @ApiOperation({ summary: 'Get suggested users to follow' })
  @ApiBearerAuth('access-token')
  async getSuggestedUsers(@UserAuth() user, @Query() query) {
    return this.usersService.getSuggestedUsers(user.id, query);
  }
}
