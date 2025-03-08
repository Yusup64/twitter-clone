'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, Avatar, Button } from '@heroui/react';

import { useAuthStore } from '@/stores/useAuthStore';
import { followUser, unfollowUser } from '@/api/users';

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName?: string;
    profilePhoto?: string;
    bio?: string;
    isFollowing?: boolean;
  };
  onSuccess?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onSuccess }) => {
  const { user: currentUser, initialize } = useAuthStore();

  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentUser = currentUser?.id === user.id;

  const handleFollow = async () => {
    if (isCurrentUser) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
      setIsFollowing(!isFollowing);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <Card className="w-full">
      <CardBody className="flex flex-row items-center gap-4">
        <Link href={`/${user.username}`}>
          <Avatar
            className="cursor-pointer"
            name={user.displayName || user.username}
            size="lg"
            src={user.profilePhoto}
          />
        </Link>

        <div className="flex-1">
          <Link className="hover:underline" href={`/${user.username}`}>
            <h3 className="text-lg font-bold">
              {user.displayName || user.username}
            </h3>
          </Link>
          <p className="text-default-500">@{user.username}</p>
          {user.bio && <p className="mt-1 text-sm">{user.bio}</p>}
        </div>

        {!isCurrentUser && (
          <Button
            color={isFollowing ? 'default' : 'primary'}
            isLoading={isLoading}
            variant={isFollowing ? 'bordered' : 'solid'}
            onClick={handleFollow}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </CardBody>
    </Card>
  );
};
