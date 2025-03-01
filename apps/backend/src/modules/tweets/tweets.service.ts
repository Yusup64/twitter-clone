import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
import { CreateTweetDto, UpdateTweetDto } from './dto';
import { CreatePollDto } from '../tweets/dto/create-poll.dto';
// import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TweetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTweetDto: CreateTweetDto) {
    const { content, mediaUrls = [], hashtags = [] } = createTweetDto;

    // 提取内容中的hashtags（如果前端没有提供）
    let extractedHashtags: string[] = hashtags;
    if (hashtags.length === 0) {
      const hashtagRegex = /#(\w+)/g;
      const matches = content.match(hashtagRegex);
      if (matches) {
        extractedHashtags = matches.map((tag) => tag.slice(1));
      }
    }

    // 创建推文并关联hashtags
    return this.prisma.tweet.create({
      data: {
        content,
        mediaUrls,
        hasMedia: mediaUrls.length > 0,
        userId,
        // 处理hashtags
        hashtags:
          extractedHashtags.length > 0
            ? {
                create: extractedHashtags.map((tag) => ({
                  hashtag: {
                    connectOrCreate: {
                      where: { name: tag },
                      create: { name: tag },
                    },
                  },
                })),
              }
            : undefined,
      },
      include: {
        user: true,
        hashtags: {
          include: {
            hashtag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
      },
    });
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, userId } = query;
    const skip = (page - 1) * limit;

    const where = userId ? { userId } : {};

    const [tweets, total] = await Promise.all([
      this.prisma.tweet.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
          poll: {
            include: {
              options: {
                include: {
                  _count: {
                    select: { votes: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              retweets: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.tweet.count({ where }),
    ]);

    return {
      tweets,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    return tweet;
  }

  async update(userId: string, id: string, updateTweetDto: UpdateTweetDto) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    if (tweet.userId !== userId) {
      throw new ForbiddenException('Cannot update tweet of other users');
    }

    return this.prisma.tweet.update({
      where: { id },
      data: {
        ...updateTweetDto,
        hashtags: updateTweetDto.hashtags
          ? {
              deleteMany: {},
              create: updateTweetDto.hashtags.map((tag) => ({
                hashtag: {
                  connectOrCreate: {
                    where: { name: tag },
                    create: { name: tag },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    if (tweet.userId !== userId) {
      throw new ForbiddenException('Cannot delete tweet of other users');
    }

    await this.prisma.tweet.delete({
      where: { id },
    });

    return { message: 'Tweet deleted successfully' };
  }

  async likeTweet(userId: string, tweetId: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    // 检查是否已经点赞
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });

    if (existingLike) {
      // 如果已经点赞，则取消点赞
      await this.prisma.like.delete({
        where: {
          userId_tweetId: {
            userId,
            tweetId,
          },
        },
      });

      return { message: 'Tweet unliked successfully' };
    }

    // 创建新的点赞
    await this.prisma.like.create({
      data: {
        userId,
        tweetId,
      },
    });

    // 创建通知
    if (tweet.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'LIKE',
          receiverId: tweet.userId,
          senderId: userId,
          tweetId,
        },
      });
    }

    return { message: 'Tweet liked successfully' };
  }

  async retweet(userId: string, tweetId: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    // 检查是否已经转发
    const existingRetweet = await this.prisma.retweet.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });

    if (existingRetweet) {
      // 如果已经转发，则取消转发
      await this.prisma.retweet.delete({
        where: {
          userId_tweetId: {
            userId,
            tweetId,
          },
        },
      });

      return { message: 'Tweet unretweeted successfully' };
    }

    // 创建新的转发
    await this.prisma.retweet.create({
      data: {
        userId,
        tweetId,
      },
    });

    // 创建通知
    if (tweet.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'RETWEET',
          receiverId: tweet.userId,
          senderId: userId,
          tweetId,
        },
      });
    }

    return { message: 'Tweet retweeted successfully' };
  }

  // 添加评论功能
  async addComment(userId: string, tweetId: string, content: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        userId,
        tweetId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // 创建通知
    if (tweet.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'COMMENT',
          receiverId: tweet.userId,
          senderId: userId,
          tweetId,
        },
      });
    }

    return comment;
  }

  // 获取用户时间线
  async getTimeline(userId: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // 获取用户关注的人的ID列表
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // 获取时间线推文
    const [tweets, total] = await Promise.all([
      this.prisma.tweet.findMany({
        where: {
          OR: [
            { userId: { in: followingIds } }, // 关注的人的推文
            { userId }, // 自己的推文
          ],
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
          _count: {
            select: {
              likes: true,
              retweets: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.tweet.count({
        where: {
          OR: [{ userId: { in: followingIds } }, { userId }],
        },
      }),
    ]);

    return {
      tweets,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createWithPoll(
    userId: string,
    createTweetDto: CreateTweetDto,
    pollData: CreatePollDto,
  ) {
    const { content } = createTweetDto;
    const { question, options, expiresAt } = pollData;

    return this.prisma.tweet.create({
      data: {
        content,
        userId,
        poll: {
          create: {
            userId,
            question,
            options: {
              create: options.map((option) => ({
                text: option,
              })),
            },
            expiresAt,
          },
        },
      },
      include: {
        user: true,
        poll: {
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
          },
        },
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
      },
    });
  }

  async getTweetById(id: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
      },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    return tweet;
  }

  async votePoll(userId: string, pollId: string, optionIndex: number) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (new Date() > poll.expiresAt) {
      throw new ForbiddenException('Poll has expired');
    }

    // 检查用户是否已经投票
    const existingVote = await this.prisma.pollVote.findFirst({
      where: {
        userId,
        optionId: { in: poll.options.map((o) => o.id) },
      },
    });

    if (existingVote) {
      throw new ForbiddenException('Already voted');
    }

    const option = poll.options[optionIndex];
    if (!option) {
      throw new NotFoundException('Option not found');
    }
    await this.prisma.pollVote.create({
      data: {
        user: {
          connect: { id: userId },
        },
        option: {
          connect: { id: option.id },
        },
        poll: {
          connect: { id: pollId },
        },
      },
    });

    // 返回更新后的投票结果
    return this.prisma.poll.findUnique({
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
      },
    });
  }

  async deleteTweet(userId: string, tweetId: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    if (tweet.userId !== userId) {
      throw new ForbiddenException('Cannot delete other users tweets');
    }

    await this.prisma.tweet.delete({
      where: { id: tweetId },
    });

    return { success: true };
  }

  async searchTweets(query: string, limit: number = 10) {
    const tweets = await this.prisma.tweet.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
      },
    });

    return { tweets };
  }

  async searchHashtags(query: string, limit: number = 10) {
    const hashtags = await this.prisma.hashtag.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: {
        tweets: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            tweets: true,
          },
        },
      },
    });

    return {
      hashtags: hashtags.map((hashtag) => ({
        id: hashtag.id,
        name: hashtag.name,
        count: hashtag._count.tweets,
      })),
    };
  }

  async getTweetsByHashtag(hashtag: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [tweets, total] = await Promise.all([
      this.prisma.tweet.findMany({
        where: {
          hashtags: {
            some: {
              hashtag: {
                name: hashtag,
              },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
          _count: {
            select: {
              likes: true,
              retweets: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.tweet.count({
        where: {
          hashtags: {
            some: {
              hashtag: {
                name: hashtag,
              },
            },
          },
        },
      }),
    ]);

    return {
      tweets,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
