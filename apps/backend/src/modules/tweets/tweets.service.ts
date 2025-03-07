import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
import { RedisService } from '@/src/common/shared/redis';
import { CachePrefix, CACHE_TTL } from '@/src/common/shared/redis';
import { CreateTweetDto, UpdateTweetDto } from './dto';
import { CreatePollDto } from '../tweets/dto/create-poll.dto';
// import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TweetsService {
  private readonly logger = new Logger(TweetsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(userId: string, createTweetDto: CreateTweetDto) {
    const { content, mediaUrls = [], hashtags = [] } = createTweetDto;

    // extract hashtags from the content (if not provided by the frontend)
    let extractedHashtags: string[] = hashtags;
    if (hashtags.length === 0) {
      const hashtagRegex = /#(\w+)/g;
      const matches = content.match(hashtagRegex);
      if (matches) {
        extractedHashtags = matches.map((tag) => tag.slice(1));
      }
    }

    // create the tweet and associate hashtags
    const tweet = await this.prisma.tweet.create({
      data: {
        content,
        mediaUrls,
        hasMedia: mediaUrls.length > 0,
        userId,
        // handle hashtags
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

    // after creating, invalidate the caches
    await this.invalidateCaches(userId);

    // invalidate the global tweets list cache
    await this.redisService.delByPattern(`${CachePrefix.TWEETS}all:*`);
    this.logger.log(`global tweets list cache invalidated`);

    return tweet;
  }

  // cache related methods
  private async invalidateCaches(userId: string) {
    try {
      // invalidate the user timeline cache
      await this.redisService.invalidateUserTimelines(userId);

      // get the followers
      const followers = await this.prisma.follow.findMany({
        where: { followingId: userId },
        select: { followerId: true },
      });

      //  invalidate the followers timelines cache
      if (followers.length > 0) {
        const followerIds = followers.map((f) => f.followerId);
        await this.redisService.invalidateFollowersTimelines(followerIds);
      }

      // invalidate the trending hashtags cache
      await this.redisService.delByPattern(`${CachePrefix.TRENDING}*`);

      this.logger.log(`caches invalidated successfully: userId=${userId}`);
    } catch (error) {
      this.logger.error(
        `failed to invalidate caches: ${error.message}`,
        error.stack,
      );
    }
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, userId } = query;
    const skip = (page - 1) * Number(limit);

    try {
      const tweets = await this.prisma.tweet.findMany({
        take: Number(limit),
        skip: skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              retweets: true,
              comments: true,
            },
          },
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
        },
      });

      // if a user id is provided, check if the user has already liked or bookmarked each tweet
      if (userId) {
        const tweetsWithUserState = await Promise.all(
          tweets.map(async (tweet) => {
            // check if the user has already liked this tweet
            const isLiked = await this.prisma.like.findUnique({
              where: {
                userId_tweetId: {
                  userId,
                  tweetId: tweet.id,
                },
              },
            });

            // check if the user has already bookmarked
            const isBookmarked = await this.prisma.bookmark.findUnique({
              where: {
                userId_tweetId: {
                  userId,
                  tweetId: tweet.id,
                },
              },
            });

            // check if the user has already retweeted
            const isRetweeted = await this.prisma.retweet.findUnique({
              where: {
                userId_tweetId: {
                  userId,
                  tweetId: tweet.id,
                },
              },
            });

            return {
              ...tweet,
              isLiked: !!isLiked,
              isBookmarked: !!isBookmarked,
              isRetweeted: !!isRetweeted,
            };
          }),
        );

        return tweetsWithUserState;
      }

      return tweets;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string, userId?: string) {
    try {
      const tweet = await this.prisma.tweet.findUnique({
        where: { id },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              retweets: true,
              comments: true,
            },
          },
          comments: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
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
        },
      });

      if (!tweet) {
        throw new NotFoundException('Tweet not found');
      }

      // if a user id is provided, check if the user has already liked, retweeted or bookmarked
      if (userId) {
        // check if the user has already liked this tweet
        const isLiked = await this.prisma.like.findUnique({
          where: {
            userId_tweetId: {
              userId,
              tweetId: tweet.id,
            },
          },
        });

        // check if the user has already bookmarked
        const isBookmarked = await this.prisma.bookmark.findUnique({
          where: {
            userId_tweetId: {
              userId,
              tweetId: tweet.id,
            },
          },
        });

        // check if the user has already retweeted
        const isRetweeted = await this.prisma.retweet.findUnique({
          where: {
            userId_tweetId: {
              userId,
              tweetId: tweet.id,
            },
          },
        });

        return {
          ...tweet,
          isLiked: !!isLiked,
          isBookmarked: !!isBookmarked,
          isRetweeted: !!isRetweeted,
        };
      }

      return tweet;
    } catch (error) {
      console.error(error);
      throw error;
    }
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

    const updatedTweet = await this.prisma.tweet.update({
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

    // after updating, invalidate the caches
    await this.redisService.delByPattern(`${CachePrefix.TWEET}${id}`);
    await this.invalidateCaches(userId);
    await this.redisService.delByPattern(`${CachePrefix.TWEETS}all:*`);

    return updatedTweet;
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

    // 删除后清除相关缓存
    await this.redisService.delByPattern(`${CachePrefix.TWEET}${id}`);
    await this.invalidateCaches(userId);
    await this.redisService.delByPattern(`${CachePrefix.TWEETS}all:*`);

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
      // if already liked, unlike
      await this.prisma.like.delete({
        where: {
          userId_tweetId: {
            userId,
            tweetId,
          },
        },
      });

      // invalidate the tweet cache
      await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweetId}`);

      return { message: 'Tweet unliked successfully' };
    }

    // create a new like
    await this.prisma.like.create({
      data: {
        userId,
        tweetId,
      },
    });

    // create a notification
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

    // invalidate the tweet cache
    await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweetId}`);

    return { message: 'Tweet liked successfully' };
  }

  async retweet(userId: string, tweetId: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    // check if the user has already retweeted
    const existingRetweet = await this.prisma.retweet.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });

    if (existingRetweet) {
      // if already retweeted, unlike
      await this.prisma.retweet.delete({
        where: {
          userId_tweetId: {
            userId,
            tweetId,
          },
        },
      });

      // invalidate the tweet cache and the timeline cache
      await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweetId}`);
      await this.invalidateCaches(userId);

      return { message: 'Tweet unretweeted successfully' };
    }

    // create a new retweet
    await this.prisma.retweet.create({
      data: {
        userId,
        tweetId,
      },
    });

    // create a notification
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

    // invalidate the tweet cache and the timeline cache
    await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweetId}`);
    await this.invalidateCaches(userId);

    return { message: 'Tweet retweeted successfully' };
  }

  // add comment functionality
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

    // create a notification
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

    // invalidate the tweet cache
    await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweetId}`);

    return comment;
  }

  // get user timeline
  async getTimeline(userId: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // try to get from cache
    const cachedTimeline = await this.redisService.getTimeline(userId, page);

    if (cachedTimeline) {
      this.logger.log(
        `get timeline from cache: userId=${userId}, page=${page}`,
      );
      return cachedTimeline;
    }

    // get the ids of the users the user is following
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // include the user's own tweets

    // get the tweets of the users the user is following
    const timeline = await this.prisma.tweet.findMany({
      where: {
        userId: { in: followingIds },
        parentId: null, // only get original tweets, not replies
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc',
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
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
      },
    });

    // cache the timeline
    await this.redisService.setTimeline(userId, page, timeline);
    this.logger.log(`timeline cached: userId=${userId}, page=${page}`);

    return timeline;
  }

  async createWithPoll(
    userId: string,
    createTweetDto: CreateTweetDto,
    pollData: CreatePollDto,
  ) {
    const { content } = createTweetDto;
    const { question, options, expiresAt } = pollData;

    const tweet = await this.prisma.tweet.create({
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

    // after creating, invalidate the caches
    await this.invalidateCaches(userId);
    await this.redisService.delByPattern(`${CachePrefix.TWEETS}all:*`);

    return tweet;
  }

  async getTweetById(id: string) {
    // try to get from cache
    const cachedTweet = await this.redisService.getTweet(id);

    if (cachedTweet) {
      this.logger.log(`get tweet details from cache: ${id}`);
      return cachedTweet;
    }

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

    // cache the tweet details
    await this.redisService.setTweet(id, tweet);
    this.logger.log(`tweet details cached: ${id}`);

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

    // check if the user has already voted
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

    // invalidate the tweet cache
    const tweet = await this.prisma.tweet.findFirst({
      where: {
        poll: {
          id: pollId,
        },
      },
      select: { id: true },
    });

    if (tweet) {
      await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweet.id}`);
    }

    // return the updated poll results
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

    // after deleting, invalidate the caches
    await this.redisService.delByPattern(`${CachePrefix.TWEET}${tweetId}`);
    await this.invalidateCaches(userId);
    await this.redisService.delByPattern(`${CachePrefix.TWEETS}all:*`);

    return { success: true };
  }

  async searchTweets(query: string, limit: number = 10) {
    // try to get from cache
    const cacheKey = `${CachePrefix.SEARCH}tweets:${query}:${limit}`;
    const cachedResults = await this.redisService.get(cacheKey);

    if (cachedResults) {
      this.logger.log(`get search results from cache: ${cacheKey}`);
      return cachedResults;
    }

    // cache not hit, search from database
    const tweets = await this.prisma.tweet.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
        _count: {
          select: {
            likes: true,
            retweets: true,
            comments: true,
          },
        },
      },
    });

    // cache the results
    await this.redisService.set(cacheKey, tweets, CACHE_TTL.SEARCH);
    this.logger.log(`search results cached: ${cacheKey}`);

    return tweets;
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

  async getCacheStats() {
    return this.redisService.getCacheHitRate();
  }
}
