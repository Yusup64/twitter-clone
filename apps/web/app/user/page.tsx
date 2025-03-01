'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import UserHome from '@/modules/user/UserHome';
import { useAuthStore } from '@/stores/useAuthStore';

const ProfilePage = () => {
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

    // 检查用户角色
    // const userRoles = user?.role;
    // const hasRequiredRole = ['USER', 'ADMIN'].some((role) =>
    //   userRoles.includes(role),
    // );

    // if (!hasRequiredRole) {
    //   router.push('/unauthorized');
    // }
  }, [user]);

  if (isLoading || !user) {
    return null;
  }

  return <UserHome />;
};

export default ProfilePage;
