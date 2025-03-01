'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { useAuthStore } from '@/stores/useAuthStore';
import { verifyToken } from '@/api/user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { set, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      if (initRef.current) return;
      initRef.current = true;

      const isLoginPage = pathname.includes('/auth/login');
      const token = localStorage.getItem('accessToken');

      if (token && !isLoading) {
        try {
          const userData = (await verifyToken(
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )) as any;

          set({ user: userData, isAuthenticated: true });

          if (isLoginPage) {
            router.push('/');
          }
        } catch (_error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });

          if (pathname.includes('/user/') && !isLoginPage) {
            router.replace(
              `/auth/login?redirect=${encodeURIComponent(pathname)}`,
            );
          }
        }
      } else if (pathname.includes('/user/') && !isLoginPage) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      }

      setIsInitialized(true);
    };

    initAuth();
  }, []);

  if (!isInitialized) {
    return <></>;
  }

  return <>{children}</>;
}
