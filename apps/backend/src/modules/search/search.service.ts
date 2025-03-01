import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, userId?: string) {
    const tweets = await this.prisma.tweet.findMany({
      where: {
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
          {
            hashtags: {
              some: {
                hashtag: { name: { contains: query, mode: 'insensitive' } },
              },
            },
          },
        ],
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      take: 20,
    });

    // 如果没有搜索词,返回推荐内容
    if (!query) {
      const recommendedTweets = await this.prisma.tweet.findMany({
        orderBy: [
          { likes: { _count: 'desc' } },
          { retweets: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              retweets: true,
              comments: true,
            },
          },
        },
        take: 10,
      });

      const recommendedUsers = await this.prisma.user.findMany({
        orderBy: [{ followers: { _count: 'desc' } }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
        where: userId ? { id: { not: userId } } : {},
        take: 10,
      });

      return {
        tweets: recommendedTweets,
        users: recommendedUsers,
      };
    }

    return {
      tweets,
      users,
    };
  }
}
