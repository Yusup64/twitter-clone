import React from 'react';
import { HashtagClient } from './HashtagClient';

// 这是服务器组件
export default function HashtagPage({ params }: { params: { tag: string } }) {
  return <HashtagClient tag={params.tag} />;
}
