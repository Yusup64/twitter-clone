import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
  getNotifications(@UserAuth() user, @Query() query) {
    return this.notificationsService.getNotifications(user.id, query);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@UserAuth() user, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@UserAuth() user) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  getUnreadCount(@UserAuth() user) {
    return this.notificationsService.getUnreadCount(user.id);
  }
}
