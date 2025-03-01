import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { PollsService } from './polls.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { UserAuth } from '@/src/common/decorators/user.decorator';
import { CreatePollDto } from '../tweets/dto/create-poll.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('polls')
@Controller('polls')
@UseGuards(JwtAuthGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post(':tweetId')
  @ApiOperation({ summary: 'Create a poll' })
  createPoll(
    @UserAuth() user,
    @Param('tweetId') tweetId: string,
    @Body() createPollDto: CreatePollDto,
  ) {
    return this.pollsService.createPoll(user.id, tweetId, createPollDto);
  }

  @Post(':pollId/vote/:optionId')
  @ApiOperation({ summary: 'Vote in a poll' })
  vote(
    @UserAuth() user,
    @Param('pollId') pollId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.pollsService.vote(user.id, pollId, optionId);
  }

  @Get(':pollId/results')
  @ApiOperation({ summary: 'Get poll results' })
  getPollResults(@Param('pollId') pollId: string) {
    return this.pollsService.getPollResults(pollId);
  }
}
