'use client';
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Spacer,
  Link,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';

import { EyeFilledIcon, EyeSlashFilledIcon } from '@/components/icons';
import { useLoading } from '@/contexts/LoadingContext';
import { useAuthStore } from '@/stores/useAuthStore';

const SignUp = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [submitted, setSubmitted] = useState<any>(null);
  const { register, user } = useAuthStore();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  // 实时密码验证
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

    return null; // 验证通过
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email) ? null : 'Invalid email address';
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
      return 'Username must contain only letters, numbers, and underscores, and be between 3 and 20 characters long';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));

    const newErrors: any = {};

    // 验证用户名
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else {
      const usernameError = validateUsername(formData.username as string);

      if (usernameError) {
        newErrors.username = usernameError;
      }
    }

    // 验证显示名称（可选）
    // 不需要验证，因为它是可选的

    // 验证邮箱
    const emailError = validateEmail(formData.email as string);

    if (emailError) {
      newErrors.email = emailError;
    }

    // 验证密码
    const passwordErrors = validatePassword(password);

    if (passwordErrors) {
      newErrors.password = passwordErrors;
    }

    // 验证条款接受
    if (!formData.terms) {
      newErrors.terms = 'Must accept terms and conditions';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    setErrors({});
    setSubmitted(formData);
    showLoading();

    register(formData)
      .then((res) => {
        hideLoading();
        addToast({
          title: 'Registration successful',
          description: 'Welcome to our platform!',
          color: 'success',
          timeout: 3000,
        });
        router.push('/');
      })
      .catch((error) => {
        addToast({
          title: 'Registration error',
          description:
            error.err || 'Registration failed, please try again later',
          color: 'danger',
          timeout: 3000,
        });
        hideLoading();
      });
  };

  // 如果用户已登录，重定向到首页
  if (user) {
    router.push('/');
  }

  return (
    <div className="flex justify-center items-center px-5 h-full">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-center text-2xl font-bold">Register</h1>

        <Form
          aria-label="Registration form"
          className="space-y-4"
          validationErrors={errors}
          onReset={() => setErrors({})}
          onSubmit={handleSubmit}
        >
          {/* 用户名输入 */}
          <Input
            required
            className="max-w-full"
            errorMessage={errors.username}
            label="Username"
            name="username"
            placeholder="Enter username"
          />

          {/* 显示名称输入（可选） */}
          <Input
            className="max-w-full"
            label="Display name (optional)"
            name="displayName"
            placeholder="Enter display name"
          />

          {/* 邮箱输入 */}
          <Input
            required
            className="max-w-full"
            errorMessage={errors.email}
            label="Email"
            name="email"
            placeholder="Enter email"
            type="email"
          />

          {/* 密码输入及验证 */}
          <Input
            required
            className="max-w-full"
            endContent={
              <button
                aria-label="Toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
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
            errorMessage={errors.password}
            label="Password"
            name="password"
            placeholder="Enter password"
            type={isVisible ? 'text' : 'password'}
            value={password}
            onValueChange={(value) => {
              setPassword(value);
              setErrors((prev: any) => ({
                ...prev,
                password: null, // Clear password error when typing
              }));
            }}
          />

          {/* 条款和条件 */}
          <Checkbox
            isRequired
            classNames={{
              label: 'text-small',
            }}
            isInvalid={!!errors.terms}
            name="terms"
            value="true"
            onValueChange={() =>
              setErrors((prev: any) => ({ ...prev, terms: undefined }))
            }
          >
            I agree to the terms and conditions
          </Checkbox>
          {errors.terms && (
            <span className="text-danger text-sm">{errors.terms}</span>
          )}

          {/* 提交按钮 */}
          <Button className="w-full" color="primary" type="submit">
            Register
          </Button>
        </Form>

        <Spacer y={1} />

        {/* 已有账号 */}
        <p className="text-center text-sm">
          Already have an account? <Link href="/auth/login">Login</Link>
        </p>

        {/* 提交数据显示（仅用于开发） */}
        {/* {submitted && (
          <div className="text-small text-default-500 mt-4">
            Submitted data: <pre>{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default SignUp;
