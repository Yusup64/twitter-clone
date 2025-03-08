'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  Input,
  Button,
  Avatar,
  Textarea,
  addToast,
  Card,
  CardBody,
  Spinner,
  Form,
} from '@heroui/react';
import { Camera, Save, Lock as LockIcon } from 'lucide-react';
import { User } from 'database/types';
import Link from 'next/link';

import { useLoading } from '@/contexts/LoadingContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { updateUserProfile } from '@/api/user';

const ProfileClient = () => {
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    username: '',
    displayName: '',
    bio: '',
    profilePhoto: '',
    coverPhoto: '',
    location: '',
    website: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showLoading, hideLoading } = useLoading();
  const { user, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers and _';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    if (formData.website && !/^https?:\/\//.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('handleSubmit', formData);
    e.preventDefault();
    showLoading();
    try {
      await updateUserProfile({
        ...formData,
        profilePhoto: formData.profilePhoto || '',
      });

      addToast({
        title: 'Profile updated',
        description: 'Profile updated successfully',
        color: 'success',
        timeout: 2000,
      });
      hideLoading();
    } catch (error) {
      console.error('Failed to update profile:', error);
      hideLoading();
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', 'twitter'); // 使用您的 Upload Preset 名称

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/djczyvsih/upload',
        {
          method: 'POST',
          body: formData,
        },
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, profilePhoto: data.secure_url }));

        return data.secure_url;
      }

      return null;
    } catch (error) {
      console.error('Failed to upload file:', error);
      addToast({
        title: 'Upload failed',
        description: 'Failed to upload avatar, please try again later',
        color: 'danger',
        timeout: 3000,
      });

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    if (files.length === 0) return;

    const file = files[0];

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      addToast({
        title: 'File too large',
        description: `File ${file.name} is too large, please try again`,
        color: 'danger',
        timeout: 3000,
      });

      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'File type error',
        description: 'Please select an image file',
        color: 'danger',
        timeout: 3000,
      });

      return;
    }

    await uploadFile(file);

    // 清空input的value,这样可以重复选择同一个文件
    e.target.value = '';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Profile</h1>

      <Card className="mb-6 border border-divider/10" shadow="none">
        <CardBody>
          <Form
            aria-label="Profile Form"
            className="space-y-4 w-full block"
            validationErrors={errors}
            onReset={() => setErrors({})}
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <Avatar
                  className="w-24 h-24 text-large mb-2 group-hover:opacity-80 transition-opacity"
                  name={user?.username}
                  src={formData.profilePhoto || ''}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-black/50 rounded-full p-2">
                    <Camera className="text-white" size={20} />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
              {isUploading && (
                <div className="mt-2">
                  <Spinner size="sm" />
                </div>
              )}
              <p className="text-sm text-default-500 mt-1">
                Click the avatar to change
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Display name"
                name="displayName"
                placeholder="Display name"
                value={formData.displayName || ''}
                onChange={handleChange}
              />

              <Textarea
                label="Bio"
                minRows={3}
                name="bio"
                placeholder="Introduce yourself..."
                value={formData.bio || ''}
                onChange={handleChange}
              />

              <Input
                label="Location"
                name="location"
                placeholder="Location"
                value={formData.location || ''}
                onChange={handleChange}
              />

              <Input
                label="Website"
                name="website"
                placeholder="Website"
                value={formData.website || ''}
                onChange={handleChange}
              />

              <div className="flex justify-end">
                <Button
                  color="primary"
                  isLoading={isLoading || isUploading}
                  startContent={<Save size={18} />}
                  type="submit"
                >
                  Save changes
                </Button>
              </div>
            </div>
          </Form>
        </CardBody>
      </Card>

      <Card className="mb-6 border border-divider/10" shadow="none">
        <CardBody>
          <div className="space-y-2">
            <p>
              <strong>Username:</strong> @{user?.username}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Registration time:</strong>{' '}
              {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6 border border-divider/10" shadow="none">
        <CardBody>
          <h2 className="text-lg font-semibold mb-2">Account Settings</h2>
          <div className="space-y-2">
            <Link
              className="text-primary hover:underline flex items-center gap-2"
              href="/auth/change-password"
            >
              <LockIcon className="w-4 h-4" />
              Change Password
            </Link>
            {/* Add more account settings options here if needed */}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProfileClient;
