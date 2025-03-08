import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
import { NotificationsGateway } from './notifications.gateway';
import * as admin from 'firebase-admin';
import { MulticastMessage } from 'firebase-admin/messaging';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    // init firebase admin sdk
    this.logger.log('Starting Firebase Admin SDK');
    this.initializeFirebaseAdmin();
  }

  // init firebase admin sdk
  private initializeFirebaseAdmin() {
    try {
      // check if firebase admin sdk is initialized
      if (admin.apps.length === 0) {
        // use credentials from environment variables
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        console.log('projectId', projectId);
        console.log('clientEmail', clientEmail);
        console.log('privateKey', privateKey);

        if (!projectId || !clientEmail || !privateKey) {
          this.logger.error('Firebase Admin SDK configuration is missing');
          this.firebaseInitialized = false;
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin SDK already initialized');
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin SDK: ${error.message}`,
      );
      this.firebaseInitialized = false;
    }
  }

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
    // do not send notification to yourself
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

    // send real-time notification through websocket
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
      // 如果Firebase未初始化，则尝试初始化
      if (!this.firebaseInitialized) {
        this.initializeFirebaseAdmin();
        if (!this.firebaseInitialized) {
          throw new Error('Firebase未初始化');
        }
      }

      // 从数据库中获取用户的FCM令牌
      const fcmTokens = await this.prisma.fcmToken.findMany({
        where: { userId },
      });

      this.logger.log(
        `查询用户 ${userId} 的FCM令牌，找到 ${fcmTokens.length} 个令牌`,
      );

      if (!fcmTokens.length) {
        this.logger.log(`用户 ${userId} 没有注册FCM令牌`);
        return { success: false, message: '用户未注册FCM令牌' };
      }

      // 提取令牌字符串
      const tokens = fcmTokens.map((t) => t.token);

      // 准备消息内容
      const message: MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        tokens: tokens,
        // 添加Android和Web的特定配置
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#1da1f2',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          },
          fcmOptions: {
            link: notification.data?.url || '/',
          },
        },
      };

      this.logger.log(
        `尝试向用户 ${userId} 的 ${tokens.length} 个设备发送推送通知`,
      );

      // 发送通知
      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `FCM推送结果: 成功=${response.successCount}, 失败=${response.failureCount}`,
      );

      // 处理失败的令牌
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({ token: tokens[idx], error: resp.error });

            // 如果错误是因为令牌无效或未注册，则删除该令牌
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              // 删除无效令牌
              this.logger.warn(`删除无效令牌: ${tokens[idx]}`);
              this.prisma.fcmToken
                .deleteMany({
                  where: { token: tokens[idx] },
                })
                .catch((err) => {
                  this.logger.error(`删除无效令牌失败: ${err.message}`);
                });
            }
          }
        });
        this.logger.warn(`推送失败的令牌: ${JSON.stringify(failedTokens)}`);
      }

      return {
        success: true,
        message: '通知已发送',
        stats: {
          total: tokens.length,
          success: response.successCount,
          failure: response.failureCount,
        },
      };
    } catch (error) {
      this.logger.error(`发送推送通知失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // FCM令牌注册
  async registerFcmToken(userId: string, token: string) {
    try {
      this.logger.log(`为用户 ${userId} 注册FCM令牌: ${token}`);

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
          this.logger.log(
            `更新FCM令牌所属用户: ${existingToken.userId} -> ${userId}`,
          );
        }
        // 如果令牌和用户ID都匹配，无需操作
        return {
          success: true,
          message: '令牌已更新',
          tokenId: existingToken.id,
        };
      }

      // 创建新令牌记录
      const newToken = await this.prisma.fcmToken.create({
        data: {
          userId,
          token,
          device: 'web', // 默认为web设备
        },
      });

      this.logger.log(`已创建新FCM令牌记录，ID: ${newToken.id}`);
      return { success: true, message: '令牌已注册', tokenId: newToken.id };
    } catch (error) {
      this.logger.error(`注册FCM令牌失败: ${error.message}`);
      return { success: false, message: '令牌注册失败', error: error.message };
    }
  }
}
