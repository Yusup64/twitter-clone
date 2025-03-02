'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  RefObject,
} from 'react';
import { Spinner } from '@heroui/react';

import { Tweet } from '@/types/tweet';
import { getTweets } from '@/api/tweets';
import { TweetCard } from '@/components/tweet/TweetCard';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { CreateTweetInput } from '@/components/tweet/CreateTweetInput';

export default function HomePage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchTweets = async (pageNum: number) => {
    try {
      if (pageNum > 1) {
        setIsLoadingMore(true);
      }
      setIsLoading(true);
      const response = await getTweets({ page: pageNum, limit: 10 });
      const newTweets = response as unknown as Tweet[];

      if (pageNum === 1) {
        setTweets(newTweets);
      } else {
        setTweets((prev) => [...prev, ...newTweets]);
      }

      setHasMore(newTweets.length === 10);
    } catch (error) {
      console.error('Failed to fetch tweets:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setPage(1);
    fetchTweets(1);
  }, []);

  useIntersectionObserver({
    target: loadMoreRef as RefObject<Element>,
    onIntersect: () => {
      if (hasMore && !isLoading && !isLoadingMore) {
        setPage((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    fetchTweets(page);
  }, [page]);

  return (
    <div className="border-x border-divider/10 min-h-screen max-w-3xl mx-auto px-5">
      <div className="border-b border-divider/10 bg-background/80 backdrop-blur-md mb-8">
        <h1 className="text-xl font-bold p-4">Home</h1>
        <div className="border-t border-divider/10 py-4">
          <CreateTweetInput onSuccess={handleRefresh} />
        </div>
      </div>

      {isLoading && page === 1 ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {tweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} onSuccess={handleRefresh} />
          ))}

          {hasMore && !isLoadingMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
        </>
      )}
    </div>
  );
}
