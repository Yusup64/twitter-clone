import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserAuth } from '@/src/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiBearerAuth('access-token')
  async getNotifications(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.id;
    return this.notificationsService.getNotifications(userId, +page, +limit);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiBearerAuth('access-token')
  markAsRead(@UserAuth() user, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiBearerAuth('access-token')
  async markAllAsRead(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiBearerAuth('access-token')
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post('register-token')
  @ApiOperation({ summary: 'Register FCM token' })
  @ApiBearerAuth('access-token')
  async registerToken(@UserAuth() user, @Body() body: { token: string }) {
    return this.notificationsService.registerFcmToken(user.id, body.token);
  }
}
