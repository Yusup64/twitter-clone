import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './common/shared/prisma';
@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {}

  getHello(): string {
    return 'Hello World!';
  }
}
