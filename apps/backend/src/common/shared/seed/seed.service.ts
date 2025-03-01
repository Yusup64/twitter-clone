import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { faker } from '@faker-js/faker';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // 只在开发环境运行
    // if (process.env.NODE_ENV === 'production') {
    //   return;
    // }
    console.log('Seeding database...');

    const usersCount = await this.prisma.user.count();
    if (usersCount > 10) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // 创建测试用户
    const users = await Promise.all(
      Array.from({ length: 10 }).map(async () => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        return this.prisma.user.create({
          data: {
            email: faker.internet.email({ firstName, lastName }),
            username: faker.internet
              .userName({ firstName, lastName })
              .toLowerCase(),
            password:
              '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 123456
            displayName: `${firstName} ${lastName}`,
            bio: faker.person.bio(),
            profilePhoto: faker.image.avatar(),
            coverPhoto: faker.image.urlLoremFlickr({ category: 'nature' }),
            location: faker.location.city(),
            website: faker.internet.url(),
            verified: faker.datatype.boolean(),
          },
        });
      }),
    );

    // 创建推文
    const tweets = await Promise.all(
      Array.from({ length: 50 }).map(async () => {
        const user = faker.helpers.arrayElement(users);
        const hasMedia = faker.datatype.boolean();

        return this.prisma.tweet.create({
          data: {
            content: faker.lorem.paragraph(),
            userId: user.id,
            mediaUrls: hasMedia
              ? Array.from({
                  length: faker.number.int({ min: 1, max: 4 }),
                }).map(() => faker.image.urlLoremFlickr({ category: 'nature' }))
              : [],
            hasMedia,
          },
        });
      }),
    );

    // 创建评论
    await Promise.all(
      Array.from({ length: 100 }).map(async () => {
        const user = faker.helpers.arrayElement(users);
        const tweet = faker.helpers.arrayElement(tweets);

        return this.prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            userId: user.id,
            tweetId: tweet.id,
          },
        });
      }),
    );

    // 创建点赞
    await Promise.all(
      Array.from({ length: 200 }).map(async () => {
        const user = faker.helpers.arrayElement(users);
        const tweet = faker.helpers.arrayElement(tweets);

        return this.prisma.like
          .create({
            data: {
              userId: user.id,
              tweetId: tweet.id,
            },
          })
          .catch(() => null); // 忽略重复点赞错误
      }),
    );

    // 创建转发
    await Promise.all(
      Array.from({ length: 50 }).map(async () => {
        const user = faker.helpers.arrayElement(users);
        const tweet = faker.helpers.arrayElement(tweets);

        return this.prisma.retweet
          .create({
            data: {
              userId: user.id,
              tweetId: tweet.id,
            },
          })
          .catch(() => null);
      }),
    );

    // 创建书签
    await Promise.all(
      Array.from({ length: 50 }).map(async () => {
        const user = faker.helpers.arrayElement(users);
        const tweet = faker.helpers.arrayElement(tweets);

        return this.prisma.bookmark
          .create({
            data: {
              userId: user.id,
              tweetId: tweet.id,
            },
          })
          .catch(() => null);
      }),
    );

    // 创建关注关系
    await Promise.all(
      Array.from({ length: 50 }).map(async () => {
        const follower = faker.helpers.arrayElement(users);
        const following = faker.helpers.arrayElement(users);

        if (follower.id === following.id) return null;

        return this.prisma.follow
          .create({
            data: {
              followerId: follower.id,
              followingId: following.id,
            },
          })
          .catch(() => null);
      }),
    );

    // 创建通知
    await Promise.all(
      Array.from({ length: 100 }).map(async () => {
        const sender = faker.helpers.arrayElement(users);
        const receiver = faker.helpers.arrayElement(users);
        const tweet = faker.helpers.arrayElement(tweets);

        if (sender.id === receiver.id) return null;

        return this.prisma.notification.create({
          data: {
            type: faker.helpers.arrayElement(Object.values(NotificationType)),
            senderId: sender.id,
            receiverId: receiver.id,
            tweetId: tweet.id,
            read: faker.datatype.boolean(),
          },
        });
      }),
    );

    console.log('Database seeded');
  }
}
