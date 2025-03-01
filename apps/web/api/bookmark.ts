import request from '@/libs/request';
import { Tweet } from '@/types/tweet';

const PREFIX = '/bookmarks';

export const getBookmarks = () => {
  return request.get<Tweet[]>(PREFIX);
};

export const addBookmark = (tweetId: string) => {
  return request.post(`${PREFIX}/${tweetId}`);
};

export const removeBookmark = (tweetId: string) => {
  return request.delete(`${PREFIX}/${tweetId}`);
};
