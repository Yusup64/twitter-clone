'use client';

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';

import { EyeFilledIcon, EyeSlashFilledIcon } from '@/components/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { changePassword } from '@/api/auth';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  // Password validation
  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Password must contain at least one special character';
    }

    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }

    return null; // Validation passed
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: any = {};

    // Validate current password
    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      addToast({
        title: 'Success',
        description: 'Your password has been changed successfully',
        color: 'success',
        timeout: 3000,
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to profile page
      router.push('/user/profile');
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        color: 'danger',
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, redirect to login page
  if (!user) {
    router.push('/auth/login');

    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-5 min-h-screen flex items-center justify-center">
      <Card className="w-full border border-divider/10" shadow="none">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">Change Password</h1>
          <p className="text-default-500 text-sm">
            Update your password to keep your account secure
          </p>
        </CardHeader>
        <Divider />
        <CardBody>
          <Form
            aria-label="Change Password Form"
            className="space-y-4"
            validationErrors={errors}
            onReset={() => setErrors({})}
            onSubmit={handleSubmit}
          >
            {/* Current Password */}
            <Input
              required
              className="max-w-full"
              endContent={
                <button
                  aria-label="Toggle current password visibility"
                  className="focus:outline-none"
                  type="button"
                  onClick={() =>
                    setIsCurrentPasswordVisible(!isCurrentPasswordVisible)
                  }
                >
                  {isCurrentPasswordVisible ? (
                    <EyeSlashFilledIcon
                      className="text-2xl pointer-events-none text-default-400"
                      size={22}
                    />
                  ) : (
                    <EyeFilledIcon
                      className="text-2xl pointer-events-none text-default-400"
                      size={22}
                    />
                  )}
                </button>
              }
              errorMessage={errors.currentPassword}
              label="Current Password"
              name="currentPassword"
              placeholder="Enter your current password"
              type={isCurrentPasswordVisible ? 'text' : 'password'}
              value={currentPassword}
              onValueChange={setCurrentPassword}
            />

            {/* New Password */}
            <Input
              required
              className="max-w-full"
              endContent={
                <button
                  aria-label="Toggle new password visibility"
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                >
                  {isNewPasswordVisible ? (
                    <EyeSlashFilledIcon
                      className="text-2xl pointer-events-none text-default-400"
                      size={22}
                    />
                  ) : (
                    <EyeFilledIcon
                      className="text-2xl pointer-events-none text-default-400"
                      size={22}
                    />
                  )}
                </button>
              }
              errorMessage={errors.newPassword}
              label="New Password"
              name="newPassword"
              placeholder="Enter your new password"
              type={isNewPasswordVisible ? 'text' : 'password'}
              value={newPassword}
              onValueChange={setNewPassword}
            />

            {/* Confirm New Password */}
            <Input
              required
              className="max-w-full"
              endContent={
                <button
                  aria-label="Toggle confirm password visibility"
                  className="focus:outline-none"
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                  }
                >
                  {isConfirmPasswordVisible ? (
                    <EyeSlashFilledIcon
                      className="text-2xl pointer-events-none text-default-400"
                      size={22}
                    />
                  ) : (
                    <EyeFilledIcon
                      className="text-2xl pointer-events-none text-default-400"
                      size={22}
                    />
                  )}
                </button>
              }
              errorMessage={errors.confirmPassword}
              label="Confirm New Password"
              name="confirmPassword"
              placeholder="Confirm your new password"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />
          </Form>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-end gap-2">
          <Button variant="flat" onClick={() => router.push('/user/profile')}>
            Cancel
          </Button>
          <Button
            color="primary"
            isLoading={isLoading}
            onClick={(e) => handleSubmit(e as any)}
          >
            Change Password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
