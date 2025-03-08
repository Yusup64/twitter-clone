'use client';

import * as React from 'react';
import { HeroUIProvider } from '@heroui/system';
import { useRouter } from 'next/navigation';
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from 'next-themes';
import { ToastProvider } from '@heroui/react';
import dynamic from 'next/dynamic';

import GlobalLoading from '@/components/GlobalLoading';
import { LoadingProvider } from '@/contexts/LoadingContext';

// 动态导入NotificationHandler组件，避免SSR问题
const NotificationHandler = dynamic(
  () => import('@/components/Notification/NotificationHandler'),
  { ssr: false },
);

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>['push']>[1]
    >;
  }
}

export function Providers({ children }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <HeroUIProvider navigate={router.push}>
          <ToastProvider placement="top-center" />
          <LoadingProvider>
            <GlobalLoading />
            <NotificationHandler />
            {children}
          </LoadingProvider>
        </HeroUIProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
