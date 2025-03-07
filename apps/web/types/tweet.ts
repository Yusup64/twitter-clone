import { User } from '@/types/user';

export interface Tweet {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string[];
  hasMedia: boolean;
  poll?: Poll;
  user: {
    id: string;
    username: string;
    displayName: string;
    profilePhoto: string;
  };
  _count: {
    likes: number;
    retweets: true;
    comments: true;
  };
  isLiked?: boolean;
  isRetweeted?: boolean;
  isBookmarked?: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    _count: {
      votes: number;
    };
  }[];
  expiresAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  pollId: string;
  _count?: {
    votes: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  tweetId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}
