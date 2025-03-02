import React from 'react';
import { Button } from '@heroui/react';
import { RefreshCw } from 'lucide-react';

export default function Offline() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">您当前处于离线状态</h1>
      <p className="text-gray-600 mb-8">
        无法连接到互联网。请检查您的网络连接并重试。
      </p>
      <div className="mb-8">
        <img
          alt="Offline"
          className="w-32 h-32 mx-auto opacity-50"
          src="/icons/icon-512x512.png"
        />
      </div>
      <Button
        className="flex items-center gap-2"
        onPress={() => window.location.reload()}
      >
        <RefreshCw size={16} />
        重新加载
      </Button>
    </div>
  );
}
