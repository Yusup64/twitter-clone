'use client';

import React, { useState } from 'react';
import { addToast, Button, Card } from '@heroui/react';
import { formatDistanceToNow } from 'date-fns';

import { votePoll } from '@/api/tweets';

interface PollDisplayProps {
  poll: {
    id: string;
    question: string;
    options: {
      id: string;
      text: string;
      votes: number;
    }[];
    expiresAt: string;
  };
  tweetId: string;
}

export const PollDisplay: React.FC<PollDisplayProps> = ({ poll, tweetId }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [localPoll, setLocalPoll] = useState(poll);

  const totalVotes = localPoll.options.reduce((sum, opt) => sum + opt.votes, 0);
  const hasExpired = new Date(poll.expiresAt) < new Date();

  const handleVote = async (optionIndex: number) => {
    try {
      setIsVoting(true);
      const updatedPoll = await votePoll(poll.id, optionIndex);

      setLocalPoll((prev) => ({
        ...prev,
        options: updatedPoll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votes: opt._count.votes,
        })),
      }));
      addToast({
        title: 'Success',
        description: 'Voted successfully',
        variant: 'flat',
      });
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.err || error.message,
        variant: 'flat',
        severity: 'danger',
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card
      className="mt-3 p-3 bg-default-50 border border-divider/10"
      shadow="none"
    >
      <h4 className="font-semibold mb-3 text-sm">{localPoll.question}</h4>
      <div className="space-y-2">
        {localPoll.options.map((option, index) => {
          const voteCount = option.votes;
          const percentage = totalVotes ? (voteCount / totalVotes) * 100 : 0;

          return (
            <div key={index} className="relative">
              <Button
                className="w-full justify-start h-8 px-3 text-sm"
                color={percentage > 0 ? 'primary' : 'default'}
                isDisabled={hasExpired || isVoting}
                variant="bordered"
                onClick={() => handleVote(index)}
              >
                <div className="flex justify-between w-full z-10 relative">
                  <span>{option.text}</span>
                  <span className="text-default-500 text-xs">
                    {percentage > 0 && `${percentage.toFixed(1)}%`}
                  </span>
                </div>
              </Button>
              <div
                className="absolute inset-0 rounded-lg bg-primary/10 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-default-500 mt-3">
        {hasExpired
          ? 'Final results'
          : `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'} · ${formatDistanceToNow(
              new Date(poll.expiresAt),
              { addSuffix: true },
            )}`}
      </p>
    </Card>
  );
};
