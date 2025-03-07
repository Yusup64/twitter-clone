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

      //  handle the response data, check if there is a data field
      const bookmarkedTweets = response.data || response;

      //  ensure the response is an array
      if (Array.isArray(bookmarkedTweets)) {
        //  add the bookmark status to all tweets
        const tweetsWithBookmarkStatus = bookmarkedTweets.map((tweet) => ({
          ...tweet,
          isBookmarked: true, // the tweets in the bookmark page are always bookmarked
        }));

        setTweets(tweetsWithBookmarkStatus);
      } else {
        console.error('Invalid bookmark data format:', bookmarkedTweets);
        setTweets([]);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      setTweets([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-divider">
          <h1 className="text-xl font-bold">Bookmarks</h1>
          <p className="text-sm text-default-500">
            Saved and bookmarked tweets
          </p>
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
                  You haven&apos;t added any bookmarks yet
                </h3>
                <p className="text-default-500">
                  When you find a tweet you like, click the bookmark icon to
                  save it here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
