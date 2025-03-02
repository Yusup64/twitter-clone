import React, { Suspense } from 'react';
import { SearchClient } from './SearchClient';

// 这是服务器组件
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
      <SearchClient />
    </Suspense>
  );
}
