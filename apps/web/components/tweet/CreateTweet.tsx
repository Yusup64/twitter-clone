'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';

import { CreateTweetInput } from './CreateTweetInput';

interface CreateTweetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTweet: React.FC<CreateTweetProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create Tweet</ModalHeader>
        <ModalBody className="pb-6">
          <CreateTweetInput onSuccess={handleSuccess} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
