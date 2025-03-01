'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Tabs,
  Tab,
  Spinner,
  Button,
  Avatar,
  useDisclosure,
  Card,
  addToast,
} from '@heroui/react';
import { Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';

import { AppLayout } from '@/components/layouts/AppLayout';
import { TweetCard } from '@/components/tweet/TweetCard';
import { ProfileEditModal } from '@/components/user/ProfileEditModal';
import { FollowersModal } from '@/components/user/FollowersModal';
import { FollowingModal } from '@/components/user/FollowingModal';
import { getUserByUsername, followUser, unfollowUser } from '@/api/users';
import { getTweets } from '@/api/tweets';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tweets');

  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();

  const {
    isOpen: isFollowersModalOpen,
    onOpen: onFollowersModalOpen,
    onClose: onFollowersModalClose,
  } = useDisclosure();

  const {
    isOpen: isFollowingModalOpen,
    onOpen: onFollowingModalOpen,
    onClose: onFollowingModalClose,
  } = useDisclosure();

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await getUserByUsername(username);

      console.log('🚀 ~ fetchUserData ~ userData:', userData);

      setUser(userData);

      setIsFollowing(userData.isFollowedByMe || false);

      // 获取用户的推文
      const tweetsData = (await getTweets({
        userId: userData.id,
      })) as any;

      setTweets(tweetsData.tweets || []);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const handleFollow = async () => {
    if (!user) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await unfollowUser(user.id);

        if (res?.message) {
          addToast({
            description: res.message as string,
            color: 'success',
            duration: 3000,
          });
        }
      } else {
        const res = await followUser(user.id);

        if (res?.message) {
          addToast({
            description: res.message as string,
            color: 'success',
            duration: 3000,
          });
        }
      }
      setIsFollowing(!isFollowing);
      // 刷新用户数据以更新关注者计数
      fetchUserData();
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    fetchUserData();
    onEditModalClose();
  };

  const isCurrentUser = currentUser?.id === user?.id;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">User not found</h1>
            <p>No user found with username @{username}</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-5">
        {/* 封面图 */}
        <div
          className="h-48 bg-default-200 relative"
          style={
            user.coverPhoto
              ? {
                  backgroundImage: `url(${user.coverPhoto})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
        >
          <div className="absolute -bottom-16 left-4">
            <Avatar
              className="border-4 border-background"
              name={user.displayName || user.username}
              size="lg"
              src={user.profilePhoto}
            />
          </div>

          <div className="absolute top-4 right-4">
            {isCurrentUser ? (
              <Button onClick={onEditModalOpen}>Edit profile</Button>
            ) : (
              <Button
                color={isFollowing ? 'warning' : 'primary'}
                isLoading={isFollowLoading}
                variant={'solid'}
                onClick={handleFollow}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {/* 用户信息 */}
        <div className="mt-20 px-4">
          <h1 className="text-2xl font-bold">
            {user.displayName || user.username}
          </h1>
          <p className="text-default-500">@{user.username}</p>

          {user.bio && <p className="mt-2">{user.bio}</p>}

          <div className="flex flex-wrap gap-4 mt-2 text-default-500">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{user.location}</span>
              </div>
            )}

            {user.website && (
              <div className="flex items-center gap-1">
                <LinkIcon size={16} />
                <a
                  className="text-primary hover:underline"
                  href={
                    user.website.startsWith('http')
                      ? user.website
                      : `https://${user.website}`
                  }
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {user.website}
                </a>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>
                Joined {format(new Date(user.createdAt), 'yyyy/MM/dd')}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button className="hover:underline" onClick={onFollowingModalOpen}>
              <span className="font-bold mr-1">{user.followingCount || 0}</span>
              Following
            </button>
            <button className="hover:underline" onClick={onFollowersModalOpen}>
              <span className="font-bold mr-1">{user.followersCount || 0}</span>
              Followers
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="mt-4 border-b border-divider">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="tweets" title="Tweets" />
            <Tab key="replies" title="Replies" />
            <Tab key="media" title="Media" />
            <Tab key="likes" title="Likes" />
          </Tabs>
        </div>

        {/* 推文列表 */}
        <div className="py-4">
          {tweets.length > 0 ? (
            <div className="space-y-4">
              {tweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  onSuccess={fetchUserData}
                />
              ))}
            </div>
          ) : (
            <div className="text-center my-12">
              <p className="text-xl text-default-500">No tweets</p>
            </div>
          )}
        </div>
      </div>

      {/* 编辑资料模态框 */}
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          user={user}
          onClose={onEditModalClose}
          onSuccess={handleProfileUpdate}
        />
      )}

      {/* 关注者模态框 */}
      {isFollowersModalOpen && (
        <FollowersModal
          isOpen={isFollowersModalOpen}
          userId={user.id}
          username={user.username}
          onClose={onFollowersModalClose}
        />
      )}

      {/* 正在关注模态框 */}
      {isFollowingModalOpen && (
        <FollowingModal
          isOpen={isFollowingModalOpen}
          userId={user.id}
          username={user.username}
          onClose={onFollowingModalClose}
        />
      )}
    </AppLayout>
  );
}
