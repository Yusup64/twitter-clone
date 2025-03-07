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

// 添加 Serwist 事件监听器
serwist.addEventListeners();

// 预缓存离线页面
self.addEventListener('install', (event) => {
  const offlineUrls = ['/offline', '/offline/', '/images/fallback.png'];

  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.addAll(offlineUrls);
    }),
  );
});

// 处理离线导航
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // 确保每次都返回 Response 对象
      fetch(event.request).catch(() => {
        return caches.match('/offline/').then((response) => {
          if (response) return response;

          return caches.match('/offline').then((offlineResp) => {
            // 确保永远返回 Response 对象
            return (
              offlineResp ||
              new Response('您处于离线状态', {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
              })
            );
          });
        });
      }),
    );
  }
});
