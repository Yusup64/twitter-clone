import { Injectable, Scope, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CachePrefix, getRedisConfig, CACHE_TTL } from './redis.config';

@Injectable({ scope: Scope.TRANSIENT })
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly defaultTTL: number;

  // 缓存统计
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(private configService: ConfigService) {
    const config = getRedisConfig(configService);
    this.defaultTTL = config.ttl;

    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`, err.stack);
    });

    // 每小时记录一次缓存命中率
    setInterval(() => {
      this.logCacheStats();
    }, 3600000); // 1小时
  }

  private logCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    if (total > 0) {
      const hitRate = (this.cacheHits / total) * 100;
      this.logger.log(
        `缓存命中率: ${hitRate.toFixed(2)}% (命中: ${this.cacheHits}, 未命中: ${this.cacheMisses})`,
      );
      // 重置计数器
      this.cacheHits = 0;
      this.cacheMisses = 0;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log('Closing Redis client connection');
      this.client.disconnect();
    }
  }

  // 基本操作方法
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) {
        this.cacheMisses++;
        return null;
      }
      this.cacheHits++;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}: ${error.message}`);
      this.cacheMisses++;
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, serializedValue, 'EX', ttl);
      } else {
        await this.client.set(key, serializedValue, 'EX', this.defaultTTL);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}: ${error.message}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting cache for key ${key}: ${error.message}`,
      );
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Error checking if key ${key} exists: ${error.message}`,
      );
      return false;
    }
  }

  // 批量操作
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const data = await this.client.mget(keys);
      const results = data.map((item) => (item ? JSON.parse(item) : null));

      // 统计命中和未命中
      const hits = results.filter((item) => item !== null).length;
      const misses = results.length - hits;
      this.cacheHits += hits;
      this.cacheMisses += misses;

      return results;
    } catch (error) {
      this.logger.error(`Error getting multiple cache keys: ${error.message}`);
      this.cacheMisses += keys.length;
      return keys.map(() => null);
    }
  }

  async mset(keyValues: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();

      Object.entries(keyValues).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        pipeline.set(key, serializedValue, 'EX', ttl || this.defaultTTL);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error(`Error setting multiple cache keys: ${error.message}`);
      return false;
    }
  }

  // 模式删除
  async delByPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.debug(`已删除 ${keys.length} 个缓存键，模式: ${pattern}`);
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting cache by pattern ${pattern}: ${error.message}`,
      );
      return false;
    }
  }

  // 特定业务方法
  async getTweet<T>(id: string): Promise<T | null> {
    return this.get<T>(`${CachePrefix.TWEET}${id}`);
  }

  async setTweet(id: string, data: any): Promise<boolean> {
    return this.set(`${CachePrefix.TWEET}${id}`, data, CACHE_TTL.TWEET);
  }

  async getTimeline<T>(userId: string, page: number = 1): Promise<T | null> {
    return this.get<T>(`${CachePrefix.TIMELINE}${userId}:${page}`);
  }

  async setTimeline(userId: string, page: number, data: any): Promise<boolean> {
    return this.set(
      `${CachePrefix.TIMELINE}${userId}:${page}`,
      data,
      CACHE_TTL.TIMELINE,
    );
  }

  async invalidateUserTimelines(userId: string): Promise<boolean> {
    return this.delByPattern(`${CachePrefix.TIMELINE}${userId}:*`);
  }

  async invalidateFollowersTimelines(followerIds: string[]): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();

      followerIds.forEach((id) => {
        pipeline.keys(`${CachePrefix.TIMELINE}${id}:*`);
      });

      const results = await pipeline.exec();
      const allKeys = results.flatMap((result) => result[1] as string[]);

      if (allKeys.length > 0) {
        await this.client.del(allKeys);
        this.logger.debug(`已删除 ${allKeys.length} 个关注者时间线缓存`);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error invalidating followers timelines: ${error.message}`,
      );
      return false;
    }
  }

  // 获取缓存命中率
  getCacheHitRate(): {
    hitRate: number;
    hits: number;
    misses: number;
    total: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
    return {
      hitRate,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      total,
    };
  }

  // 获取Redis客户端实例（用于高级操作）
  getClient(): Redis {
    return this.client;
  }
}
