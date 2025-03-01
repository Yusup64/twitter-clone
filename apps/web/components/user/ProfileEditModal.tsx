'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Avatar,
  addToast,
} from '@heroui/react';
import { Camera } from 'lucide-react';

import { updateUserProfile } from '@/api/user';
import { uploadToCloudinary } from '@/utils/upload';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    user.profilePhoto,
  );
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(
    user.coverPhoto,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setCoverPhoto(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 上传头像
      let profilePhotoUrl = user.profilePhoto;

      if (profilePhoto) {
        const result = await uploadToCloudinary(profilePhoto);

        profilePhotoUrl = result.url;
      }

      // 上传封面图
      let coverPhotoUrl = user.coverPhoto;

      if (coverPhoto) {
        const result = await uploadToCloudinary(coverPhoto);

        coverPhotoUrl = result.url;
      }

      // 更新资料
      await updateUserProfile({
        ...formData,
        profilePhoto: profilePhotoUrl,
        coverPhoto: coverPhotoUrl,
      });

      addToast({
        title: 'Success',
        description: 'Profile updated',
        color: 'success',
        timeout: 3000,
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update profile',
        color: 'danger',
        timeout: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-bold">Edit profile</h2>
        </ModalHeader>

        <ModalBody>
          {/* 封面图 */}
          <div className="relative mb-6">
            <div
              className="h-32 bg-default-200 rounded-lg"
              style={
                coverPhotoPreview
                  ? {
                      backgroundImage: `url(${coverPhotoPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            >
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer rounded-lg">
                <Camera className="text-white" />
                <input
                  accept="image/*"
                  className="hidden"
                  type="file"
                  onChange={handleCoverPhotoChange}
                />
              </label>
            </div>

            {/* 头像 */}
            <div className="absolute -bottom-10 left-4">
              <div className="relative">
                <Avatar
                  className="border-4 border-background"
                  name={formData.displayName || user.username}
                  size="lg"
                  src={profilePhotoPreview || ''}
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full cursor-pointer">
                  <Camera className="text-white" size={20} />
                  <input
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={handleProfilePhotoChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <Input
              label="Display name"
              maxLength={50}
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
            />

            <Textarea
              label="Bio"
              maxLength={160}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />

            <Input
              label="Location"
              maxLength={30}
              name="location"
              value={formData.location}
              onChange={handleChange}
            />

            <Input
              label="Website"
              maxLength={100}
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="bordered" onClick={onClose}>
            Cancel
          </Button>
          <Button color="primary" isLoading={isLoading} onClick={handleSubmit}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
