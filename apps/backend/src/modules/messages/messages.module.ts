import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { PrismaService } from '@/src/common/shared/prisma';

@Module({
  controllers: [MessagesController],
  providers: [PrismaService, MessagesGateway, MessagesService],
})
export class MessagesModule {}
