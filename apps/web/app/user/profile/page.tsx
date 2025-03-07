'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import ProfileClient from '@/modules/user/profile/ProfileClient';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, checkAuth, isLoading, initialized, initialize } =
    useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 确保 auth store 已初始化
    if (!initialized) {
      initialize();
    }

    // 检查认证状态
    const isAuthenticated = checkAuth();

    // 如果认证失败且已初始化完成，则重定向到登录页面
    if (!isAuthenticated && initialized && !isLoading) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent('/user/profile')}`,
      );
    }

    // 如果用户数据已加载或确认未认证，停止检查
    if ((user && initialized) || (!isAuthenticated && initialized)) {
      setIsCheckingAuth(false);
    }
  }, [user, initialized, isLoading]);

  // 显示加载状态，当正在检查认证或正在加载用户信息时
  if (isCheckingAuth || isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto px-5 animate-pulse">
        <div className="h-8 w-48 bg-default-200 rounded mx-auto mb-8" />
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-default-200" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-default-200 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 如果没有用户数据但已完成认证检查，可能是发生了错误
  if (!user && !isCheckingAuth) {
    return (
      <div className="w-full max-w-lg mx-auto text-center py-10">
        <p className="text-lg">无法加载用户信息，请重新登录</p>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
          onClick={() => router.push('/auth/login')}
        >
          返回登录
        </button>
      </div>
    );
  }

  return <ProfileClient />;
}
