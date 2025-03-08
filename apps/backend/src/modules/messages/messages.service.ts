import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';
import { NotificationsService } from '../notifications/notifications.service';

// 用一个简单的内存存储来跟踪活跃的聊天会话
// 在生产环境中，这应该使用Redis或其他分布式存储
const activeChats = new Map<string, Set<string>>();

// 用户活跃会话结构: { userId: { otherUserId1, otherUserId2, ... } }
// 表示userId正在与otherUserId1, otherUserId2等用户聊天

@Injectable()
export class MessagesService {
  private logger = new Logger('MessagesService');

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}
  /**
   * Retrieves all conversations for a given user, including the latest message and unread count.
   */
  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                read: false,
              },
            },
          },
        },
      },
    });

    return conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;

      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages[0],
        unreadCount: conv._count.messages,
        isOnline: false, // 移除WebSocket在线状态检查，默认为离线  YO OFFLINE HO
        isInChat: false, // 移除WebSocket聊天状态检查，默认为不在聊天中 YO ONLINE HO
      };
    });
  }

  /**
   * Retrieves the list of users the given user is following.
   */

  async getFollowingUsers(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
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

    return following.map((f) => f.following);
  }

  /**
   * Retrieves messages exchanged between the given user and another user, and marks them as read.
   */
  // MESSAGE service ko kaam message forward garda userId re receiver ID lai sodhcha jun agadi gaera Id anusaar forward hunxa ID chai primary key hunxa

  async getMessages(userId: string, otherUserId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // 标记消息为已读
    await this.markMessagesAsRead(userId, otherUserId);

    return messages;
  }

  // 添加用户活跃聊天状态的方法
  setUserActiveChat(userId: string, otherUserId: string) {
    if (!activeChats.has(userId)) {
      activeChats.set(userId, new Set());
    }
    activeChats.get(userId).add(otherUserId);
    this.logger.log(`用户 ${userId} 开始与 ${otherUserId} 聊天`);
  }

  // 移除用户活跃聊天状态的方法
  removeUserActiveChat(userId: string, otherUserId: string) {
    if (activeChats.has(userId)) {
      activeChats.get(userId).delete(otherUserId);
      this.logger.log(`用户 ${userId} 结束与 ${otherUserId} 聊天`);
    }
  }

  // 检查用户是否在与特定用户聊天
  isUserInActiveChat(userId: string, otherUserId: string): boolean {
    return activeChats.has(userId) && activeChats.get(userId).has(otherUserId);
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    this.logger.log(
      `发送消息: 发送者=${senderId}, 接收者=${receiverId}, 内容=${content}`,
    );

    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (!conversation) {
      this.logger.log(`未找到对话，创建新对话`);
      conversation = await this.prisma.conversation.create({
        data: {
          user1Id: senderId,
          user2Id: receiverId,
        },
      });
    } else {
      this.logger.log(`找到现有对话: ${conversation.id}`);
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    this.logger.log(`消息创建成功: ${message.id}`);

    // 如果消息发送成功，发送推送通知
    try {
      // 获取发送者信息，用于通知标题
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { displayName: true, username: true },
      });

      const senderName = sender.displayName || sender.username;

      // 检查接收者是否在与发送者的活跃聊天中
      const isInActiveChat = this.isUserInActiveChat(receiverId, senderId);

      // 如果接收者不在活跃聊天中，则发送推送通知
      if (!isInActiveChat) {
        this.logger.log(
          `User ${receiverId} is not in the active chat with ${senderId}, sending push notification`,
        );

        // 发送推送通知
        await this.notificationsService.sendPushNotification(receiverId, {
          title: `From ${senderName}`,
          body:
            content.length > 60 ? content.substring(0, 60) + '...' : content,
          data: {
            url: `/messages?userId=${senderId}`,
            type: 'message',
            senderId: senderId,
            conversationId: conversation.id,
          },
        });

        this.logger.log(`Push notification sent to user ${receiverId}`);
      } else {
        this.logger.log(
          `User ${receiverId} is in the active chat with ${senderId}, not sending push notification`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      // 通知发送失败不影响消息发送功能
    }

    return message;
  }

  /**
   * Marks all messages in a conversation as read by the user.
   */
  // sabi padhya napadhyeko mark bhayera agadi aaunxa

  async markAsRead(userId: string, conversationId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  // message delete huxna

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Cannot delete other users messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  }

  // 标记特定用户发送的消息为已读
  async markMessagesAsRead(userId: string, senderId: string) {
    await this.prisma.message.updateMany({
      where: {
        senderId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  // 获取与特定用户的未读消息
  async getUnreadMessages(
    userId: string,
    otherUserId: string,
    lastMessageId?: string,
  ) {
    this.logger.log(
      `获取未读消息: 用户=${userId}, 对方=${otherUserId}, 最后消息ID=${lastMessageId || '无'}`,
    );

    const whereClause: any = {
      senderId: otherUserId,
      receiverId: userId,
      read: false,
    };

    // 如果提供了lastMessageId，只获取比这个ID更新的消息
    if (lastMessageId) {
      const lastMessage = await this.prisma.message.findUnique({
        where: { id: lastMessageId },
        select: { createdAt: true },
      });

      if (lastMessage) {
        whereClause.createdAt = {
          gt: lastMessage.createdAt,
        };
      }
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    this.logger.log(`找到 ${messages.length} 条未读消息`);

    // 标记这些消息为已读
    if (messages.length > 0) {
      await this.markMessagesAsRead(userId, otherUserId);
    }

    return messages;
  }

  // 获取所有未读消息数量
  async getUnreadCount(userId: string) {
    this.logger.log(`获取未读消息数量: 用户=${userId}`);

    const counts = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                read: false,
              },
            },
          },
        },
        user1: {
          select: {
            id: true,
          },
        },
        user2: {
          select: {
            id: true,
          },
        },
      },
    });

    const result = counts.map((conv) => {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      return {
        conversationId: conv.id,
        otherUserId,
        count: conv._count.messages,
      };
    });

    const totalCount = result.reduce((sum, item) => sum + item.count, 0);
    this.logger.log(`总共 ${totalCount} 条未读消息`);

    return {
      total: totalCount,
      conversations: result,
    };
  }
}
