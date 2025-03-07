'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';
import { Bookmark } from 'lucide-react';

import { AppLayout } from '@/components/layouts/AppLayout';
import { getBookmarks } from '@/api/bookmark';
import { Tweet } from '@/types/tweet';
import { TweetCard } from '@/components/tweet/TweetCard';

export default function BookmarksPage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await getBookmarks();

      // 处理API返回的数据，判断是否有data字段
      const bookmarkedTweets = response.data || response;

      // 确保返回的是数组
      if (Array.isArray(bookmarkedTweets)) {
        setTweets(bookmarkedTweets);
      } else {
        console.error('Invalid bookmark data format:', bookmarkedTweets);
        setTweets([]);
      }
    } catch (error) {
      console.error('获取书签失败:', error);
      setTweets([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-divider">
          <h1 className="text-xl font-bold">书签</h1>
          <p className="text-sm text-default-500">保存和收藏的推文</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8 min-h-[300px]">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {tweets.length > 0 ? (
              tweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  isBookmarked={true}
                  tweet={tweet}
                  onSuccess={fetchBookmarks}
                />
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="flex justify-center mb-4">
                  <Bookmark className="w-12 h-12 text-default-300" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  您还没有添加任何书签
                </h3>
                <p className="text-default-500">
                  当您在浏览时发现喜欢的推文，点击书签图标将其保存到这里
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
