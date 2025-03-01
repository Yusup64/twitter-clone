'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spinner } from '@heroui/react';

import { getTweetById } from '@/api/tweets';
import { TweetCard } from '@/components/tweet/TweetCard';
import { CommentList } from '@/components/tweet/CommentList';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Tweet, Comment } from '@/types/tweet';

export default function TweetDetailPage() {
  const { id } = useParams();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ws = useWebSocket();

  const fetchTweet = async () => {
    try {
      const data = await getTweetById(id as string);

      setTweet(data);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch tweet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTweet();

    const unsubscribe = ws.subscribe('tweet:commented', (data: any) => {
      if (data.tweetId === id) {
        setComments((prev) => [data.comment, ...prev]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id, ws]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tweet) {
    return <div>Tweet not found</div>;
  }

  return (
    <div className="mx-auto p-4 max-w-3xl">
      <TweetCard showComments={false} tweet={tweet} onSuccess={fetchTweet} />
      <CommentList comments={comments} />
    </div>
  );
}
