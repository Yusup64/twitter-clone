'use client';
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Spacer,
  Link,
  addToast,
} from '@heroui/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { EyeFilledIcon, EyeSlashFilledIcon } from '@/components/icons';
import { useAuthStore } from '@/stores/useAuthStore';

const LoginPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [submitted, setSubmitted] = useState<any>(null);
  const { login, user, isAuthenticated, initialize, initialized } =
    useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  // 确保认证存储已初始化
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // 处理重定向逻辑
  useEffect(() => {
    // 只有当初始化完成且用户已认证时才进行重定向
    if (initialized && isAuthenticated && user) {
      if (redirectTo && redirectTo !== '/auth/login') {
        router.push(redirectTo);
      } else {
        router.push('/user/profile');
      }
    }
  }, [initialized, isAuthenticated, user, router, redirectTo]);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    const newErrors: any = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    setErrors({});
    setSubmitted(formData);
    login(formData).catch((err) => {
      addToast({
        title: 'Login failed',
        description: err.message || 'Please check your email and password',
        color: 'danger',
        timeout: 1500,
      });
    });
  };

  // 如果正在加载且已认证，显示加载中
  if (isAuthenticated && user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center px-5 min-h-screen h-full pt-16">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-center text-2xl font-bold">Login Your Account</h1>

        {/* Login Form */}
        <Form
          aria-label="Login Form"
          className="space-y-4"
          validationErrors={errors}
          onReset={() => setErrors({})}
          onSubmit={handleSubmit}
        >
          {/* Email Input */}
          <Input
            required
            className="max-w-full"
            errorMessage={errors.email}
            label="Email"
            name="email"
            placeholder="Please enter your email"
            type="email"
          />

          {/* Password Input */}
          <Input
            required
            className="max-w-full"
            endContent={
              <button
                aria-label="toggle password visibility"
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
            placeholder="Please enter your password"
            type={isVisible ? 'text' : 'password'}
            value={password}
            onValueChange={setPassword}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between w-full">
            <Checkbox className="text-sm" name="rememberMe">
              Remember Me
            </Checkbox>
            <Link color="primary" href="/user/forgot-password" size="sm">
              Forgot Password
            </Link>
          </div>

          {/* Sign In Button */}
          <Button className="w-full" color="primary" type="submit">
            Login
          </Button>
        </Form>

        <Spacer y={1} />

        {/* Sign Up Link */}
        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link color="primary" href="/auth/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
