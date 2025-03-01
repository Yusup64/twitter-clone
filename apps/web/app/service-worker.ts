export default function worker() {
  // 安装事件
  self.addEventListener('install', (event) => {
    console.log('Service Worker 安装成功');
    // 跳过等待，直接激活
    self.skipWaiting();
  });

  // 激活事件
  self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活成功');
    // 立即接管所有客户端
    self.clients.claim();
  });

  // 网络请求拦截
  self.addEventListener('fetch', (event) => {
    // 默认的 fetch 处理
    event.respondWith(
      fetch(event.request).catch(() => {
        // 如果网络请求失败，返回离线页面
        return caches.match('/offline.html');
      }),
    );
  });
}
