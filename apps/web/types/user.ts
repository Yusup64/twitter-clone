export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    followers: number;
    following: number;
    tweets: number;
  };
}
