import React, { Suspense } from 'react';
import { Metadata } from 'next';

import { SearchClient } from './SearchClient';

export const metadata: Metadata = {
  title: 'Search | Twitter Clone',
  description: 'Search for users, tweets, and hashtags',
};

// 这是服务器组件
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <SearchClient />
    </Suspense>
  );
}
