'use client';

import React, { useState, useEffect } from 'react';
import { Spinner, Button } from '@heroui/react';
import { Hash } from 'lucide-react';

import { TweetList } from '@/components/tweet/TweetList';
import { getTweetsByHashtag } from '@/api/tweets';

interface HashtagResponse {
  tweets: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface HashtagClientProps {
  tag: string;
}

export function HashtagClient({ tag }: HashtagClientProps) {
  const [tweets, setTweets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const fetchTweets = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const response: HashtagResponse = await getTweetsByHashtag(tag, {
        page: pageNum,
        limit: 10,
      });
      console.log("🚀 ~ fetchTweets ~ response:", response)

      if (pageNum === 1) {
        setTweets(response.tweets);
      } else {
        setTweets((prev) => [...prev, ...response.tweets]);
      }

      setMeta(response.meta);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching hashtag tweets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [tag]);

  const loadMore = () => {
    if (meta && page < meta.totalPages) {
      fetchTweets(page + 1);
    }
  };

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="p-4 border-b border-divider">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <Hash className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">#{tag}</h1>
            {meta && <p className="text-default-500">{meta.total} 条推文</p>}
          </div>
        </div>
      </div>

      {isLoading && tweets.length === 0 ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : tweets.length > 0 ? (
        <>
          <TweetList tweets={tweets} />

          {meta && page < meta.totalPages && (
            <div className="p-4 flex justify-center">
              <Button isLoading={isLoading} variant="light" onClick={loadMore}>
                加载更多
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-8 text-default-500">
          没有找到 #{tag} 的推文
        </div>
      )}
    </div>
  );
} 