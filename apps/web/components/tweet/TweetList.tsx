import React from 'react';

import { Tweet } from './Tweet';

interface TweetListProps {
  tweets: any[];
  onActionComplete?: () => void;
}

export const TweetList: React.FC<TweetListProps> = ({
  tweets,
  onActionComplete,
}) => {
  if (!tweets || tweets.length === 0) {
    return (
      <div className="text-center p-8 text-default-500">没有推文可显示</div>
    );
  }

  return (
    <div className="divide-y divide-divider">
      {tweets.map((tweet) => (
        <Tweet
          key={tweet.id}
          tweet={tweet}
          onActionComplete={onActionComplete}
        />
      ))}
    </div>
  );
};
