import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { receiverId: userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
          tweet: {
            select: {
              id: true,
              content: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: { receiverId: userId },
      }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createNotification(data: {
    type: 'LIKE' | 'COMMENT' | 'RETWEET' | 'FOLLOW' | 'MENTION';
    receiverId: string;
    senderId: string;
    tweetId?: string;
    commentId?: string;
  }) {
    // 不要给自己发送通知
    if (data.receiverId === data.senderId) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        tweet: {
          select: {
            id: true,
            content: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    // 通过WebSocket发送实时通知
    this.notificationsGateway.sendNotificationToUser(
      data.receiverId,
      notification,
    );

    return notification;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.receiverId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    return { count };
  }

  // 注册FCM令牌
  async registerFcmToken(userId: string, token: string) {
    try {
      // 由于我们还没有执行迁移，暂时模拟FCM令牌注册
      console.log(`为用户 ${userId} 注册FCM令牌: ${token}`);

      // 模拟成功响应
      return { success: true, message: '令牌已注册（模拟）' };

      /* 
      // 实际代码（需要在迁移后启用）
      // 检查令牌是否已存在
      const existingToken = await this.prisma.fcmToken.findFirst({
        where: { token },
      });

      if (existingToken) {
        // 如果令牌存在但用户ID不同，则更新用户ID
        if (existingToken.userId !== userId) {
          await this.prisma.fcmToken.update({
            where: { id: existingToken.id },
            data: { userId },
          });
        }
        // 如果令牌和用户ID都匹配，无需操作
        return { success: true, message: '令牌已更新' };
      }

      // 创建新令牌记录
      await this.prisma.fcmToken.create({
        data: {
          userId,
          token,
          device: 'web', // 默认为web设备
        },
      });

      return { success: true, message: '令牌已注册' };
      */
    } catch (error) {
      console.error('注册FCM令牌失败:', error);
      return { success: false, message: '令牌注册失败', error: error.message };
    }
  }

  // 发送FCM通知
  async sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: any;
    },
  ) {
    try {
      // 模拟发送通知
      console.log(`将通知发送到用户 ${userId}:`, notification);

      // 模拟成功响应
      return { success: true, message: '通知已发送（模拟）' };

      /*
      // 实际代码（需要在迁移后启用）
      // 获取用户的所有FCM令牌
      const fcmTokens = await this.prisma.fcmToken.findMany({
        where: { userId },
      });

      if (!fcmTokens.length) {
        console.log(`用户 ${userId} 没有注册FCM令牌`);
        return;
      }

      // 这里应该集成实际的Firebase Admin SDK来发送消息
      // 此处仅为实现示例
      console.log(`将通知发送到用户 ${userId} 的 ${fcmTokens.length} 个设备:`, notification);
      
      // 实际发送通知的代码将在后续实现
      return { success: true, tokensCount: fcmTokens.length };
      */
    } catch (error) {
      console.error('发送推送通知失败:', error);
      return { success: false, error: error.message };
    }
  }
}
