'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import ProfileClient from '@/modules/user/profile/ProfileClient';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // 检查认证状态
    const isAuthenticated = checkAuth();

    if (!isAuthenticated) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent('/user/profile')}`,
      );

      return;
    }
  }, []);

  // Show loading skeleton while checking authentication
  if (isLoading) {
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

  if (!user) {
    return null;
  }

  return <ProfileClient />;
}
