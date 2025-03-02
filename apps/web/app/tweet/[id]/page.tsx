'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spinner } from '@heroui/react';

import { getTweetById } from '@/api/tweets';
import { TweetCard } from '@/components/tweet/TweetCard';
import { CommentList } from '@/components/tweet/CommentList';
import { Tweet, Comment } from '@/types/tweet';

export default function TweetDetailPage() {
  const { id } = useParams();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTweet = async () => {
    try {
      const data = await getTweetById(id as string);

      if (data && typeof data === 'object' && 'id' in data) {
        setTweet(data as unknown as Tweet);
        setComments((data.comments || []) as Comment[]);
      }
    } catch (error) {
      console.error('Failed to fetch tweet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTweet();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <p className="text-xl">Tweet not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <TweetCard showComments={false} tweet={tweet} onSuccess={fetchTweet} />
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        <CommentList comments={comments} />
      </div>
    </div>
  );
}
