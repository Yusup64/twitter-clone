'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardBody, Avatar, Button, Spinner } from '@heroui/react';
import { Heart, MessageCircle, Repeat, UserPlus, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { AppLayout } from '@/components/layouts/AppLayout';
import { getNotifications, markAllAsRead } from '@/api/notifications';
import { useAuthStore } from '@/stores/useAuthStore';

interface NotificationResponse {
  notifications: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum = 1, append = false) => {
    setIsLoading(true);
    try {
      const response = (await getNotifications({
        page: pageNum,
        limit: 20,
      })) as unknown as NotificationResponse;

      if (append && response.notifications) {
        setNotifications((prev) => [...prev, ...response.notifications]);
      } else if (response.notifications) {
        setNotifications(response.notifications);
      }

      if (response.meta) {
        setHasMore(pageNum < response.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 标记所有通知为已读
    markAllAsRead();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;

    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="text-danger" />;
      case 'COMMENT':
        return <MessageCircle className="text-primary" />;
      case 'RETWEET':
        return <Repeat className="text-success" />;
      case 'FOLLOW':
        return <UserPlus className="text-primary" />;
      case 'MENTION':
        return <AtSign className="text-primary" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: any) => {
    const senderName =
      notification.sender.displayName || notification.sender.username;

    switch (notification.type) {
      case 'LIKE':
        return (
          <>
            <Link
              className="font-bold hover:underline"
              href={`/${notification.sender.username}`}
            >
              {senderName}
            </Link>{' '}
            liked your tweet
          </>
        );
      case 'COMMENT':
        return (
          <>
            <Link
              className="font-bold hover:underline"
              href={`/${notification.sender.username}`}
            >
              {senderName}
            </Link>{' '}
            commented on your tweet
          </>
        );
      case 'RETWEET':
        return (
          <>
            <Link
              className="font-bold hover:underline"
              href={`/${notification.sender.username}`}
            >
              {senderName}
            </Link>{' '}
            retweeted your tweet
          </>
        );
      case 'FOLLOW':
        return (
          <>
            <Link
              className="font-bold hover:underline"
              href={`/${notification.sender.username}`}
            >
              {senderName}
            </Link>{' '}
            followed you
          </>
        );
      case 'MENTION':
        return (
          <>
            <Link
              className="font-bold hover:underline"
              href={`/${notification.sender.username}`}
            >
              {senderName}
            </Link>{' '}
            mentioned you in a tweet
          </>
        );
      default:
        return null;
    }
  };

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
        return '#';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-divider">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        <div className="p-4">
          {isLoading && page === 1 ? (
            <div className="flex justify-center my-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {notifications.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={getNotificationLink(notification)}
                    >
                      <Card className="w-full hover:bg-default-50 cursor-pointer">
                        <CardBody className="flex items-start gap-4">
                          <div className="p-2 rounded-full bg-default-100">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={
                                  notification.sender.displayName ||
                                  notification.sender.username
                                }
                                size="sm"
                                src={notification.sender.profilePhoto}
                              />
                              <div>
                                <p>{getNotificationText(notification)}</p>
                                <p className="text-small text-default-500">
                                  {formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    {
                                      addSuffix: true,
                                    },
                                  )}
                                </p>
                              </div>
                            </div>

                            {notification.tweet && (
                              <p className="mt-2 text-default-500 line-clamp-2">
                                {notification.tweet.content}
                              </p>
                            )}
                          </div>

                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center my-12">
                  <p className="text-xl text-default-500">No notifications</p>
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    isLoading={isLoading}
                    variant="bordered"
                    onClick={handleLoadMore}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
