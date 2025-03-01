'use client';

import * as React from 'react';
import { HeroUIProvider } from '@heroui/system';
import { useRouter } from 'next/navigation';
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from 'next-themes';
import { ToastProvider } from '@heroui/react';

import { WebSocketProvider } from '@/contexts/WebSocketContext';
import GlobalLoading from '@/components/GlobalLoading';
import { LoadingProvider } from '@/contexts/LoadingContext';

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
        <WebSocketProvider>
          <HeroUIProvider navigate={router.push}>
            <ToastProvider placement="top-center" />
            <LoadingProvider>
              <GlobalLoading />
              {children}
            </LoadingProvider>
          </HeroUIProvider>
        </WebSocketProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
