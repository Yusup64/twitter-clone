// import Firebase core module
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js',
);

// Config Firebase - directly use environment variable values
const firebaseConfig = {
  apiKey: 'AIzaSyDMW7b2AMODcwx4x8eHUpeDmv2KaKBQq70',
  authDomain: 'social-media-99955.firebaseapp.com',
  projectId: 'social-media-99955',
  storageBucket: 'social-media-99955.firebasestorage.app',
  messagingSenderId: '693685351605',
  appId: '1:693685351605:web:4c7c865049108adcc7bafc',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Messaging instance
const messaging = firebase.messaging();

// 打印一条消息到控制台，确认Service Worker已加载
console.log('[firebase-messaging-sw.js] Service Worker 已加载和激活');

// Set background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 收到后台消息 ', payload);

  try {
    // 获取通知类型，默认为普通通知
    const notificationType = payload.data?.type || 'default';

    // 自定义通知选项 - 使用简单的配置避免兼容性问题
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      // 使用简单、常见的图标格式
      icon: '/favicon.ico', // 大多数网站都有favicon
      // 最小化配置项以增加兼容性
      tag: 'notification-' + Date.now(), // 使用时间戳作为唯一标签
      data: payload.data || {},
    };

    // 显示通知前记录尝试
    console.log('[firebase-messaging-sw.js] trying to show notification:', {
      title: notificationTitle,
      options: notificationOptions,
    });

    // 显示通知
    return self.registration.showNotification(
      notificationTitle,
      notificationOptions,
    );
  } catch (error) {
    console.error(
      '[firebase-messaging-sw.js] error showing notification:',
      error,
    );
  }
});

// Click notification handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);

  // 获取通知数据
  const notification = event.notification;
  const data = notification.data || {};

  // 关闭通知
  notification.close();

  // 确定导航URL
  let url = '/';

  // 根据通知数据中的url字段确定跳转地址
  if (data.url) {
    console.log('[firebase-messaging-sw.js] 通知数据包含URL:', data.url);
    url = data.url;
  } else if (data.type === 'message' && data.senderId) {
    console.log('[firebase-messaging-sw.js] 通知是消息类型, 构建消息页面URL');
    url = `/messages?userId=${data.senderId}`;
  }

  console.log('[firebase-messaging-sw.js] 将打开URL:', url);

  // 打开或聚焦页面
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 检查是否已有窗口打开
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            console.log('[firebase-messaging-sw.js] 找到匹配的窗口, 聚焦它');

            return client.focus();
          }
        }

        // 如果没有找到匹配的窗口，打开新窗口
        if (self.clients.openWindow) {
          console.log('[firebase-messaging-sw.js] 打开新窗口:', url);

          return self.clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('[firebase-messaging-sw.js] 打开URL时出错:', error);

        // 尝试最简单的方式打开主页
        return self.clients.openWindow('/');
      }),
  );
});
