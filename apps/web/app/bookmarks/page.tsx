'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';

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
      const data = await getBookmarks();

      setTweets(data);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-divider">
        <h1 className="text-xl font-bold">Bookmarks</h1>
      </div>

      <div className="divide-y divide-divider">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} onSuccess={fetchBookmarks} />
        ))}
      </div>

      {tweets.length === 0 && (
        <div className="p-8 text-center text-default-500">
          You haven't added any Tweets to your Bookmarks yet
        </div>
      )}
    </div>
  );
}
