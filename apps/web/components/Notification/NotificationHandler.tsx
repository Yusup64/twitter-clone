import { useEffect, useState } from 'react';

import {
  requestNotificationsPermission,
  onMessageListener,
} from '../../firebase/firebaseInit';

interface NotificationMessage {
  notification: {
    title: string;
    body: string;
  };
  data?: any;
}

export default function NotificationHandler() {
  const [notification, setNotification] = useState<NotificationMessage | null>(
    null,
  );

  useEffect(() => {
    // 初始化时请求通知权限
    const initNotifications = async () => {
      try {
        // 先注册Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            // 首先注册Firebase消息服务工作线程
            await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js',
              {
                // 指定作用域为Firebase Cloud Messaging服务
                scope: '/firebase-cloud-messaging-push-scope',
              },
            );
            console.log('Firebase messaging service worker 注册成功');
          } catch (err) {
            console.error('Firebase messaging service worker 注册失败:', err);
          }
        }

        // 判断环境是否支持通知
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const token = await requestNotificationsPermission();

          console.log('FCM Token设置状态:', !!token);
        } else {
          console.log('此浏览器不支持通知');
        }
      } catch (error) {
        console.error('初始化通知失败:', error);
      }
    };

    initNotifications();

    // 设置消息监听器
    const messagePromise = onMessageListener();

    if (messagePromise) {
      messagePromise.then((payload: any) => {
        if (payload) {
          setNotification({
            notification: payload.notification,
          });

          // 如果浏览器支持，使用原生通知API
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            // 在应用处于前台时显示通知
            new Notification(payload.notification?.title || '新通知', {
              body: payload.notification?.body || '',
              icon: '/icons/icon-192x192.png', // 确保有这个图标或替换为实际路径
            });
          }
        }
      });
    }

    return () => {
      // 清理函数
    };
  }, []);

  return null; // 这个组件不渲染任何UI
}
