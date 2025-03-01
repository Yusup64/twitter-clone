import React, { useEffect } from 'react';
import { addToast } from '@heroui/react';

import {
  initializeSocket,
  subscribeToNotifications,
  closeSocket,
} from '@/libs/socket';
import { useAuthStore } from '@/stores/useAuthStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuthStore();

  // 初始化WebSocket连接和通知监听
  useEffect(() => {
    if (user) {
      // 初始化WebSocket连接
      initializeSocket();

      // 订阅通知
      const unsubscribe = subscribeToNotifications((notification) => {
        // 显示通知提示
        addToast({
          title: '新通知',
          description: getNotificationText(notification),
          color: 'primary',
          timeout: 5000,
        });
      });

      return () => {
        unsubscribe();
        closeSocket();
      };
    }
  }, [user]);

  // 获取通知文本
  const getNotificationText = (notification: any) => {
    const senderName =
      notification.sender.displayName || notification.sender.username;

    switch (notification.type) {
      case 'LIKE':
        return `${senderName} 喜欢了你的推文`;
      case 'COMMENT':
        return `${senderName} 评论了你的推文`;
      case 'RETWEET':
        return `${senderName} 转发了你的推文`;
      case 'FOLLOW':
        return `${senderName} 关注了你`;
      case 'MENTION':
        return `${senderName} 在推文中提到了你`;
      default:
        return '你有一条新通知';
    }
  };

  // 获取通知链接
  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'LIKE':
      case 'COMMENT':
      case 'RETWEET':
      case 'MENTION':
        return `/tweet/${notification.tweetId}`;
      case 'FOLLOW':
        return `/${notification.sender.username}`;
      default:
        return '/notifications';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  );
};
