import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Avatar,
} from '@heroui/react';
import { formatDistanceToNow } from 'date-fns';

import { addComment } from '@/api/tweets';
import { Tweet } from '@/types/tweet';

interface CommentModalProps {
  tweet: Tweet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  tweet,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await addComment(tweet.id, content);
      setContent('');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Reply</ModalHeader>
        <ModalBody>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <Avatar alt={tweet.user.username} src={tweet.user.profilePhoto} />
              <div className="w-0.5 grow bg-default-200 my-2" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {tweet.user.displayName || tweet.user.username}
                </span>
                <span className="text-default-500 text-sm">
                  {formatDistanceToNow(new Date(tweet.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="mt-1">{tweet.content}</p>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Avatar alt={tweet.user.username} src={tweet.user.profilePhoto} />
            <div className="flex-1">
              <Textarea
                minRows={3}
                placeholder="Tweet your reply"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" isLoading={isLoading} onPress={handleSubmit}>
            Reply
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
