'use client';

import { AuthProvider } from '@/components/auth/AuthProvider';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
