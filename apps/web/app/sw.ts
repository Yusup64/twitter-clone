import type { PrecacheEntry } from 'serwist';

import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

// 声明全局配置类型
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// 创建 Serwist 实例
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// 添加事件监听器
serwist.addEventListeners();

// 预缓存离线页面和fallback图片
self.addEventListener('install', (event) => {
  const offlineUrls = ['/offline', '/images/fallback.png'];

  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.addAll(offlineUrls);
    }),
  );
});
