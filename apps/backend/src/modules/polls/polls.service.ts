import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
import { CreatePollDto } from '../tweets/dto/create-poll.dto';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  async createPoll(
    userId: string,
    tweetId: string,
    createPollDto: CreatePollDto,
  ) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    return this.prisma.poll.create({
      data: {
        question: createPollDto.question,
        expiresAt: createPollDto.expiresAt
          ? new Date(createPollDto.expiresAt)
          : null,
        userId,
        tweetId,
        options: {
          create: createPollDto.options.map((text) => ({
            text,
          })),
        },
      },
      include: {
        options: true,
      },
    });
  }

  async vote(userId: string, pollId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
      throw new BadRequestException('Poll has expired');
    }

    const option = poll.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new NotFoundException('Option not found');
    }

    // 检查用户是否已经投票
    const existingVote = await this.prisma.pollVote.findUnique({
      where: {
        userId_pollId: {
          userId,
          pollId,
        },
      },
    });

    if (existingVote) {
      throw new BadRequestException('User has already voted');
    }

    // 创建投票
    const vote = await this.prisma.pollVote.create({
      data: {
        userId,
        pollId,
        optionId,
      },
    });

    // 如果投票已结束，创建通知
    if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
      await this.prisma.notification.create({
        data: {
          type: 'POLL_ENDED',
          receiverId: poll.userId,
          senderId: userId,
          tweetId: poll.tweetId,
        },
      });
    }

    return vote;
  }

  async getPollResults(pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const totalVotes = poll._count.votes;
    const results = poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      percentage: totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0,
    }));

    return {
      id: poll.id,
      question: poll.question,
      totalVotes,
      results,
      expiresAt: poll.expiresAt,
      isExpired: poll.expiresAt ? new Date() > new Date(poll.expiresAt) : false,
    };
  }
}
