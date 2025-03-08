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
  markAsRead(@UserAuth() user, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post('register-token')
  async registerToken(@Request() req, @Body() body: { token: string }) {
    const userId = req.user.id;
    return this.notificationsService.registerFcmToken(userId, body.token);
  }
}
