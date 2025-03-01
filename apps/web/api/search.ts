import request from '@/libs/request';
import { Tweet } from '@/types/tweet';
import { User } from '@/types/user';

interface SearchResponse {
  tweets: Tweet[];
  users: User[];
}

export const search = (query?: string) => {
  return request.get<SearchResponse>('/search', {
    q: query,
  });
};
