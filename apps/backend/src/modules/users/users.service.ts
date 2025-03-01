import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            tweets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserProfile(username: string, userId: string) {
    const profile = await this.findByUsername(username);
    let isFollowedByMe = false;

    if (userId) {
      isFollowedByMe = await this.isFollowing(userId, profile.id);
    }

    const [following, followers] = await Promise.all([
      this.prisma.follow.count({
        where: { followerId: profile.id },
      }),
      this.prisma.follow.count({
        where: { followingId: profile.id },
      }),
    ]);
    return {
      ...profile,
      isFollowedByMe,
      followingCount: following,
      followersCount: followers,
    };
  }

  async getUserTweets(username: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [tweets, total] = await Promise.all([
      this.prisma.tweet.findMany({
        where: { userId: user.id },
        skip,
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
      }),
      this.prisma.tweet.count({
        where: { userId: user.id },
      }),
    ]);

    return {
      tweets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async followUser(followerId: string, followingId: string) {
    // 检查是否已经关注
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    // 如果已经关注，直接返回现有关系
    if (existingFollow) {
      return {
        message: 'You have already followed this user',
        follow: existingFollow,
      };
    }

    // 创建新的关注关系
    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // 创建关注通知
    await this.prisma.notification.create({
      data: {
        type: 'FOLLOW',
        receiverId: followingId,
        senderId: followerId,
      },
    });

    return {
      message: 'Followed successfully',
      follow,
    };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return follow;
  }

  async getUserFollowers(userId: string, query: any) {
    const { limit = 10, page = 1 } = query;
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
        },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserFollowing(userId: string, query: any) {
    const { limit = 10, page = 1 } = query;
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
        },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      following,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(query: string, limit: number = 10) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
      },
    });

    return { users };
  }

  async getSuggestedUsers(userId: string, query: any) {
    const { limit = 5 } = query;

    // 获取用户已关注的人
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // 排除自己

    // 查找用户未关注的人
    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
      },
      take: Number(limit),
      orderBy: {
        createdAt: 'desc', // 可以根据需要更改排序逻辑
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
      },
    });

    return { users };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }
}
