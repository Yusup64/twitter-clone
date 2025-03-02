import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { UserAuth } from '@/src/common/decorators/user.decorator';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  getConversations(@UserAuth() user) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('following')
  @ApiOperation({ summary: 'Get following users for messaging' })
  getFollowingUsers(@UserAuth() user) {
    return this.messagesService.getFollowingUsers(user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get messages with a user' })
  getMessages(@UserAuth() user, @Param('userId') userId: string) {
    return this.messagesService.getMessages(user.id, userId);
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Send message to a user' })
  sendMessage(
    @UserAuth() user,
    @Param('userId') userId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(user.id, userId, content);
  }

  @Post('read/:conversationId')
  markAsRead(
    @UserAuth('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.markAsRead(userId, conversationId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(@UserAuth() user, @Param('messageId') messageId: string) {
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  @Get('unread/:userId')
  @ApiOperation({ summary: 'Get unread messages with a user' })
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

  @Get('unread-count')
  @ApiOperation({ summary: 'Get all unread message count' })
  getUnreadCount(@UserAuth() user) {
    return this.messagesService.getUnreadCount(user.id);
  }
}
