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

  // initialize the WebSocket connection and notification listening
  useEffect(() => {
    if (user) {
      // initialize the WebSocket connection
      initializeSocket();

      // subscribe to notifications
      const unsubscribe = subscribeToNotifications((notification) => {
        // show the notification toast
        addToast({
          title: 'New notification',
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

  // get the notification text
  const getNotificationText = (notification: any) => {
    const senderName =
      notification.sender.displayName || notification.sender.username;

    switch (notification.type) {
      case 'LIKE':
        return `${senderName} liked your tweet`;
      case 'COMMENT':
        return `${senderName} commented on your tweet`;
      case 'RETWEET':
        return `${senderName} retweeted your tweet`;
      case 'FOLLOW':
        return `${senderName} followed you`;
      case 'MENTION':
        return `${senderName} mentioned you in a tweet`;
      default:
        return 'You have a new notification';
    }
  };

  // get the notification link
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
