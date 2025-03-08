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
  const [_notification, setNotification] = useState<NotificationMessage | null>(
    null,
  );

  //  用于检查图标是否存在
  const checkImageExists = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });

      return response.ok;
    } catch (e) {
      console.error(`Check image exists failed: ${url}`, e);

      return false;
    }
  };

  // 显示测试通知
  const showTestNotification = () => {
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        return true;
      } else {
        console.warn(
          'Cannot show test notification, permission status:',
          Notification.permission,
        );

        return false;
      }
    } catch (e) {
      console.error('Show test notification failed:', e);

      return false;
    }
  };

  useEffect(() => {
    // 初始化时请求通知权限
    const initNotifications = async () => {
      try {
        // 输出浏览器通知支持情况
        console.log(
          'Browser notification API support status:',
          typeof Notification !== 'undefined',
        );
        console.log(
          'Current notification permission status:',
          Notification.permission,
        );

        // 先注册Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            // 首先注册Firebase消息服务工作线程
            const registration = await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js',
              {
                // 指定作用域为Firebase Cloud Messaging服务
                scope: '/firebase-cloud-messaging-push-scope',
              },
            );

            console.log(
              'Firebase messaging service worker registered successfully:',
              registration,
            );

            // 确保service worker已激活
            if (registration.active) {
              console.log('Service Worker is activated');
            } else {
              console.log(
                'Service Worker is not activated, waiting for activation...',
              );
              await new Promise((resolve) => {
                if (registration.installing) {
                  registration.installing.addEventListener(
                    'statechange',
                    (e) => {
                      if ((e.target as any).state === 'activated') {
                        console.log('Service Worker is activated');
                        resolve(true);
                      }
                    },
                  );
                }
              });
            }
          } catch (err) {
            console.error(
              'Firebase messaging service worker registration failed:',
              err,
            );
          }
        }

        // 判断环境是否支持通知
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const token = await requestNotificationsPermission();

          console.log('FCM Token setup status:', !!token);

          // 手动检查通知权限状态
          console.log(
            'Notification permission status:',
            Notification.permission,
          );

          // 检查图标路径是否有效
          const iconExists = await checkImageExists('/icons/icon-192x192.png');

          console.log('Notification icon exists:', iconExists);

          // 尝试显示测试通知
          setTimeout(() => {
            const testResult = showTestNotification();

            console.log('Test notification display result:', testResult);
          }, 2000);
        } else {
          console.log('This browser does not support notifications');
        }
      } catch (error) {
        console.error('Initialize notification failed:', error);
      }
    };

    initNotifications();

    // 设置消息监听器
    const messagePromise = onMessageListener();

    if (messagePromise) {
      messagePromise.then((payload: any) => {
        if (payload) {
          console.log('Processing received front-end message:', payload);
          setNotification({
            notification: payload.notification,
          });

          // 如果浏览器支持，使用原生通知API
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              console.log(
                'Attempting to display front-end message notification...',
              );

              // 使用可靠的图标
              const iconPath = '/favicon.ico'; // 所有项目都应该有favicon

              // 在应用处于前台时显示通知
              const notification = new Notification(
                payload.notification?.title || 'New notification',
                {
                  body: payload.notification?.body || '',
                  icon: iconPath,
                  tag: 'message-notification', // 标记通知，相同标记的通知会替换之前的
                  data: payload.data, // 传递额外数据
                  requireInteraction: false, // 允许通知自动消失
                  silent: false, // 允许声音
                },
              );

              // 添加通知点击事件处理
              notification.onclick = function () {
                console.log('通知被点击, 数据:', payload.data);
                window.focus();

                if (payload.data?.url) {
                  // 检查URL是否是绝对路径还是相对路径
                  const url = payload.data.url;

                  console.log('准备跳转到URL:', url);

                  try {
                    // 确保URL是以/开头的相对路径
                    if (url.startsWith('/')) {
                      const fullUrl = window.location.origin + url;

                      console.log('跳转到完整URL:', fullUrl);
                      window.location.href = fullUrl;
                    } else if (url.startsWith('http')) {
                      // 如果是完整的URL（以http开头）
                      console.log('跳转到绝对URL:', url);
                      window.location.href = url;
                    } else {
                      // 其他情况，添加/前缀
                      const fullUrl = window.location.origin + '/' + url;

                      console.log('跳转到构造的URL:', fullUrl);
                      window.location.href = fullUrl;
                    }
                  } catch (error) {
                    console.error('跳转URL时出错:', error, '尝试的URL:', url);
                    // 尝试使用最简单的跳转方式
                    try {
                      window.location.href = '/messages';
                    } catch (e) {
                      console.error('甚至无法跳转到基本页面:', e);
                    }
                  }
                } else {
                  console.warn('通知数据中没有URL:', payload.data);
                  // 默认跳转到消息页面
                  window.location.href = '/messages';
                }

                this.close();
              };

              console.log('Notification object created:', notification);

              // 确保通知在5秒后关闭（如果还存在）
              setTimeout(() => {
                try {
                  notification.close();
                } catch (e) {
                  // 忽略可能的错误
                }
              }, 5000);
            } catch (error) {
              console.error('Display notification failed:', error);

              // 尝试使用更简单的通知方式
              try {
                alert(
                  `New message: ${payload.notification?.title}\n${payload.notification?.body}`,
                );
              } catch (e) {
                console.error('Even alert failed:', e);
              }
            }
          } else {
            console.warn(
              'Notification permission not granted or browser does not support notifications, permission status:',
              typeof Notification !== 'undefined'
                ? Notification.permission
                : 'undefined',
            );
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
