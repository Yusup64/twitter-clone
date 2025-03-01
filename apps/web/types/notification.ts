export interface Notification {
  id: string;
  type: 'LIKE' | 'RETWEET' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'POLL_ENDED';
  receiverId: string;
  senderId: string;
  tweetId?: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    profilePhoto?: string;
  };
}
