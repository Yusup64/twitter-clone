import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { UserAuth } from '@/src/common/decorators/user.decorator';

/**
 * Controller for handling messaging-related operations.
 * Requires JWT authentication for all routes.
 */
@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Retrieves a list of conversations for the authenticated user.
   *
   * @param user - Extracted from the authenticated request.
   * @returns A list of conversations the user is involved in.
   */
  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiBearerAuth('access-token')
  getConversations(@UserAuth() user) {
    return this.messagesService.getConversations(user.id);
  }

  /**
   * Retrieves a list of users that the authenticated user is following for messaging purposes.
   *
   * @param user - Extracted from the authenticated request.
   * @returns A list of followed users.
   */
  @Get('following')
  @ApiOperation({ summary: 'Get following users for messaging' })
  @ApiBearerAuth('access-token')
  getFollowingUsers(@UserAuth() user) {
    return this.messagesService.getFollowingUsers(user.id);
  }

  /**
   * Retrieves messages exchanged between the authenticated user and a specific user.
   *
   * @param user - Extracted from the authenticated request.
   * @param userId - The ID of the other user in the conversation.
   * @returns A list of messages between the two users.
   */
  @Get(':userId')
  @ApiOperation({ summary: 'Get messages with a user' })
  @ApiBearerAuth('access-token')
  getMessages(@UserAuth() user, @Param('userId') userId: string) {
    return this.messagesService.getMessages(user.id, userId);
  }

  /**
   * Sends a message to a specific user.
   *
   * @param user - Extracted from the authenticated request.
   * @param userId - The recipient user's ID.
   * @param content - The content of the message being sent.
   * @returns The newly created message.
   */
  @Post(':userId')
  @ApiOperation({ summary: 'Send message to a user' })
  @ApiBearerAuth('access-token')
  sendMessage(
    @UserAuth() user,
    @Param('userId') userId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(user.id, userId, content);
  }

  /**
   * Marks all messages in a conversation as read.
   *
   * @param userId - Extracted from the authenticated request.
   * @param conversationId - The ID of the conversation to mark as read.
   * @returns A success message confirming the operation.
   */
  @Post('read/:conversationId')
  @ApiOperation({ summary: 'Mark a conversation as read' })
  @ApiBearerAuth('access-token')
  markAsRead(
    @UserAuth('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.markAsRead(userId, conversationId);
  }

  /**
   * Deletes a specific message.
   *
   * @param user - Extracted from the authenticated request.
   * @param messageId - The ID of the message to delete.
   * @returns The deleted message object.
   */
  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiBearerAuth('access-token')
  async deleteMessage(@UserAuth() user, @Param('messageId') messageId: string) {
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  /**
   * Retrieves unread messages from a specific user.
   *
   * @param user - Extracted from the authenticated request.
   * @param userId - The ID of the user whose unread messages are being retrieved.
   * @param lastMessageId - (Optional) The ID of the last read message for pagination.
   * @returns A list of unread messages.
   */
  @Get('unread/:userId')
  @ApiOperation({ summary: 'Get unread messages with a user' })
  @ApiBearerAuth('access-token')
  getUnreadMessages(
    @UserAuth() user,
    @Param('userId') userId: string,
    @Query('lastMessageId') lastMessageId?: string,
  ) {
    return this.messagesService.getUnreadMessages(
      user.id,
      userId,
      lastMessageId,
    );
  }

  /**
   * Retrieves the total count of unread messages for the authenticated user.
   *
   * @param user - Extracted from the authenticated request.
   * @returns The number of unread messages.
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get all unread message count' })
  @ApiBearerAuth('access-token')
  getUnreadCount(@UserAuth() user) {
    return this.messagesService.getUnreadCount(user.id);
  }

  // 添加活跃聊天状态管理接口
  @Post('active-chat')
  @UseGuards(JwtAuthGuard)
  async setActiveChatStatus(
    @Request() req,
    @Body() data: { otherUserId: string; active: boolean },
  ) {
    const userId = req.user.id;

    if (data.active) {
      this.messagesService.setUserActiveChat(userId, data.otherUserId);
      return { success: true, message: '已设置活跃聊天状态' };
    } else {
      this.messagesService.removeUserActiveChat(userId, data.otherUserId);
      return { success: true, message: '已移除活跃聊天状态' };
    }
  }
}
