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

import { getFollowing } from '@/api/users';

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

interface FollowingResponse {
  following: any[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const FollowingModal: React.FC<FollowingModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
}) => {
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFollowing = async () => {
    setIsLoading(true);
    try {
      const response = (await getFollowing(userId)) as FollowingResponse;

      if (response && response.following) {
        setFollowing(response.following);
      }
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFollowing();
    }
  }, [isOpen, userId]);

  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-bold">@{username} following</h2>
        </ModalHeader>

        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center my-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="py-4">
              {following.length > 0 ? (
                <div className="space-y-3">
                  {following.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user.following}
                      onSuccess={fetchFollowing}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center my-8">
                  <p className="text-default-500">No following</p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
