import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/src/common/shared/prisma';

@Injectable()
export class MessagesService {
  private logger = new Logger('MessagesService');

  constructor(private prisma: PrismaService) {}

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
        isOnline: false, // 移除WebSocket在线状态检查，默认为离线
        isInChat: false, // 移除WebSocket聊天状态检查，默认为不在聊天中
      };
    });
  }

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

    return message;
  }

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
