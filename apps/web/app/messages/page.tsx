'use client';
import { Suspense } from 'react';

import MessagesPageContent from '@/modules/messages';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
