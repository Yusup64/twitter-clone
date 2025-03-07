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
    // ensure the auth store is initialized
    if (!initialized) {
      initialize();
    }

    // check the authentication status
    const isAuthenticated = checkAuth();

    // if the authentication fails and the initialization is complete, redirect to the login page
    if (!isAuthenticated && initialized && !isLoading) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent('/user/profile')}`,
      );
    }

    // if the user data is loaded or confirmed not authenticated, stop checking
    if ((user && initialized) || (!isAuthenticated && initialized)) {
      setIsCheckingAuth(false);
    }
  }, [user, initialized, isLoading]);

  // show loading state, when checking authentication or loading user information
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

  // If there is no user data but authentication check is complete, it may have occurred an error
  if (!user && !isCheckingAuth) {
    return (
      <div className="w-full max-w-lg mx-auto text-center py-10">
        <p className="text-lg">
          Cannot load user information, please log in again
        </p>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
          onClick={() => router.push('/auth/login')}
        >
          Back to login
        </button>
      </div>
    );
  }

  return <ProfileClient />;
}
