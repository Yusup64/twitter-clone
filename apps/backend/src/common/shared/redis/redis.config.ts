import { ConfigService } from '@nestjs/config';

export enum CachePrefix {
  TWEET = 'tweet:',
  TWEETS = 'tweets:',
  USER = 'user:',
  TIMELINE = 'timeline:',
  HASHTAG = 'hashtag:',
  TRENDING = 'trending:',
  SEARCH = 'search:',
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl: number; // 默认缓存过期时间（秒）
}

export const getRedisConfig = (configService: ConfigService): RedisConfig => {
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD', ''),
    db: configService.get<number>('REDIS_DB', 0),
    keyPrefix: configService.get<string>('REDIS_KEY_PREFIX', 'twitter:'),
    ttl: configService.get<number>('REDIS_DEFAULT_TTL', 3600), // 默认1小时
  };
};

// 缓存时间配置（秒）
export const CACHE_TTL = {
  TWEET: 3600, // 单条推文缓存1小时
  TWEETS: 30, // 推文列表缓存30秒
  USER: 1800, // 用户信息缓存30分钟
  TIMELINE: 30, // 时间线缓存30秒
  HASHTAG: 600, // 话题缓存10分钟
  TRENDING: 300, // 热门话题缓存5分钟
  SEARCH: 60, // 搜索结果缓存1分钟
};
