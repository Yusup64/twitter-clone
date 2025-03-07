'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from '@heroui/react';

import { UserCard } from './UserCard';

import { getFollowers } from '@/api/users';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

interface FollowersResponse {
  followers: any[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
}) => {
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFollowers = async () => {
    setIsLoading(true);
    try {
      const response = (await getFollowers(
        userId,
      )) as unknown as FollowersResponse;

      if (response && response.followers) {
        setFollowers(response.followers);
      }
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-bold">Followers of @{username}</h2>
        </ModalHeader>

        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center my-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {followers.length > 0 ? (
                <div className="space-y-4">
                  {followers.map((follower) => (
                    <UserCard
                      key={follower.id}
                      user={follower}
                      onSuccess={fetchFollowers}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center my-8">
                  <p className="text-default-500">No followers</p>
                </div>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
