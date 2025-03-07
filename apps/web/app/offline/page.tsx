'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-default-500" />
      </div>

      <h1 className="text-3xl font-bold mb-2">You are offline</h1>
      <p className="text-default-500 mb-8 max-w-md">
        Please check your network connection and try again.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          color="primary"
          startContent={<RefreshCw />}
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>

        <Link passHref href="/">
          <Button startContent={<Home />} variant="bordered">
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-sm text-default-400">
        <p>Some cached content may still be available</p>
      </div>
    </div>
  );
}
