'use client';

import { Suspense } from 'react';

import LoginPage from '@/modules/user/login/LoginPage';

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
