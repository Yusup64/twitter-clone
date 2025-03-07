'use client';

import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { Button } from '@heroui/react';

import { Providers } from './providers';

import { SideNav } from '@/components/sidebar/SideNav';
import { useAuthStore } from '@/stores/useAuthStore';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { getUser } = useAuthStore();

  // Check if the current route is an auth route
  const isAuthPage =
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/auth');

  useEffect(() => {
    getUser();
  }, []);

  if (isAuthPage) {
    return (
      <html suppressHydrationWarning lang="en">
        <head>
          <meta
            content="width=device-width, initial-scale=1, maximum-scale=1"
            name="viewport"
          />
          <meta content="#1DA1F2" name="theme-color" />
          <link href="/manifest.webmanifest" rel="manifest" />
          <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
        </head>
        <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }

  return (
    <html suppressHydrationWarning lang="zh-CN">
      <head>
        <meta
          content="width=device-width, initial-scale=1, maximum-scale=1"
          name="viewport"
        />
        <meta content="#1DA1F2" name="theme-color" />
        <link href="/manifest.webmanifest" rel="manifest" />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-divider sticky top-0 bg-background z-50">
              <Button
                isIconOnly
                variant="light"
                onClick={() => setIsSidebarOpen(true)}
              >
                <LayoutGrid />
              </Button>
              <h1 className="text-xl font-bold">Twitter Clone</h1>
              <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
              <div
                aria-modal="true"
                className="fixed inset-0 z-50 lg:hidden"
                role="dialog"
              >
                <button
                  aria-label="Close sidebar"
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                  onClick={() => setIsSidebarOpen(false)}
                />
                <div className="absolute inset-y-0 left-0 w-72 bg-background border-r border-divider/10 flex flex-col justify-between">
                  <div className="flex justify-end p-4">
                    <Button
                      isIconOnly
                      variant="light"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <X />
                    </Button>
                  </div>
                  <SideNav onItemClick={() => setIsSidebarOpen(false)} />
                </div>
              </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block fixed top-0 left-0 h-screen w-72 border-r border-divider/10">
              <SideNav />
            </div>

            {/* Main Content */}
            <main className="lg:ml-72">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
