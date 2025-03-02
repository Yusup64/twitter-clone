import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/src/common/shared/prisma/prisma.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  LoggingInterceptor,
  ResponseInterceptor,
} from '@/src/common/interceptors';
import { ErrorHandlerInterceptors } from '@/src/common/interceptors';
import { LoggerModule } from '@/src/common/shared/logger/logger.module';
import { RedisModule } from '@/src/common/shared/redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController, AuthService } from '@/src/common/shared/auth';
import { JwtStrategy } from '@/src/common/strategy';
import { TweetsModule } from './modules/tweets/tweets.module';
import { PollsModule } from './modules/polls/polls.module';
import { UsersModule } from './modules/users/users.module';

import { AuthModule } from '@/src/common/shared/auth/auth.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { SeedModule } from './common/shared/seed/seed.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    LoggerModule,
    RedisModule,
    JwtModule.register({}),
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TweetsModule,
    PollsModule,
    UsersModule,
    MessagesModule,
    NotificationsModule,
    BookmarksModule,
    SeedModule,
    SearchModule,
  ],
  controllers: [AppController, AuthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorHandlerInterceptors,
    },
    AppService,
    AuthService,
    JwtStrategy,
  ],
})

/* 
@Module({
  imports: [
    LoggerModule,
    JwtModule.register({}),
    PassportModule,
    ArticlesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorHandlerInterceptors,
    },
  ],
}) */
export class AppModule {}

/*
@Module({
  imports: [
    JwtModule.register({}),
    PassportModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    { 
      provide: APP_GUARD, 
      useClass: JwtAuthGuard 
    },
    { 
      provide: APP_GUARD, 
      useClass: RolesGuard 
    }
  ]
})
export class AppModule {}

*/
