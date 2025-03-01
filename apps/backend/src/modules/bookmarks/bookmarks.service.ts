import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId,
      },
      include: {
        tweet: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bookmarks.map((bookmark) => ({
      ...bookmark.tweet,
      isLiked: false, // 需要额外查询
      isRetweeted: false, // 需要额外查询
      isBookmarked: true,
    }));
  }

  async addBookmark(userId: string, tweetId: string) {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    return this.prisma.bookmark.create({
      data: {
        userId,
        tweetId,
      },
    });
  }

  async removeBookmark(userId: string, tweetId: string) {
    return this.prisma.bookmark.delete({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });
  }
}
