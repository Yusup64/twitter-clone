import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves all bookmarks for a specific user.
   * 
   * @param userId - The ID of the user whose bookmarks are being retrieved.
   * @returns A list of bookmarked tweets, including details such as likes, retweets, and comments count.
   */
  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId,
      },
      include: {
        tweet: {
          include: {
            user: true, // Include tweet author's details
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
        createdAt: 'desc', // Order bookmarks by newest first
      },
    });

    return bookmarks.map((bookmark) => ({
      ...bookmark.tweet,
      isLiked: false, // Needs additional query to determine if the user liked the tweet
      isRetweeted: false, // Needs additional query to check if the user retweeted the tweet
      isBookmarked: true, // The tweet is already bookmarked
    }));
  }

  /**
   * Adds a new bookmark for a given tweet by a specific user.
   * 
   * @param userId - The ID of the user who is bookmarking the tweet.
   * @param tweetId - The ID of the tweet to be bookmarked.
   * @throws NotFoundException if the tweet does not exist.
   * @returns The newly created bookmark record.
   */
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

  /**
   * Removes a bookmark for a specific tweet by a user.
   * 
   * @param userId - The ID of the user removing the bookmark.
   * @param tweetId - The ID of the tweet being unbookmarked.
   * @returns The deleted bookmark record.
   */
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