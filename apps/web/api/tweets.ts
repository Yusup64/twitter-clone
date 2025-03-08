import { Poll } from 'database/types';

import request from '@/libs/request';
import { Tweet } from '@/types/tweet';

const PREFIX = '/tweets';

interface CreateTweetData {
  content: string;
  mediaFiles?: File[];
  mediaUrls?: string[];
  hashtags?: string[];
}

interface CreatePollData {
  question: string;
  options: string[];
  expiresAt: Date;
}

export const createTweet = async (data: CreateTweetData) => {
  if (data.mediaUrls) {
    return request.post<Tweet>('/tweets', {
      content: data.content,
      mediaUrls: data.mediaUrls,
      hashtags: data.hashtags || [],
    });
  }

  const formData = new FormData();

  formData.append('content', data.content);

  if (data.mediaFiles) {
    data.mediaFiles.forEach((file) => {
      formData.append('media', file);
    });
  }

  if (data.hashtags && data.hashtags.length > 0) {
    data.hashtags.forEach((tag, index) => {
      formData.append(`hashtags[${index}]`, tag);
    });
  }

  return request.post<Tweet>('/tweets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const createTweetWithPoll = async (
  tweetData: { content: string },
  pollData: CreatePollData,
) => {
  return request.post<Tweet>('/tweets/with-poll', {
    content: tweetData.content,
    poll: pollData,
  });
};

export const getTweets = async (params?: any) => {
  return request.get(`${PREFIX}`, params);
};

export const likeTweet = async (id: string) => {
  return request.post(`${PREFIX}/${id}/like`);
};

export const retweet = async (id: string) => {
  return request.post(`${PREFIX}/${id}/retweet`);
};

export const addComment = async (id: string, content: string) => {
  return request.post(`${PREFIX}/${id}/comment`, { content });
};

export const getTimeline = async (params?: any) => {
  return request.get(`${PREFIX}/timeline`, params);
};

export const votePoll = async (pollId: string, optionIndex: number) => {
  return request.post<Poll>(`${PREFIX}/poll/${pollId}/vote`, { optionIndex });
};

export const deleteTweet = (tweetId: string) => {
  return request.delete<{ success: boolean }>(`/tweets/${tweetId}`);
};

export const searchTweets = async (params: {
  query: string;
  limit?: number;
}) => {
  return request.get(`${PREFIX}/search`, params);
};

export const searchHashtags = async (query: string, limit: number = 10) => {
  return request.get(`/tweets/hashtags/search`, {
    query,
    limit,
  });
};

export const getTweetsByHashtag = async (tag: string, params?: any) => {
  return request.get(`/tweets/hashtags/${tag}`, params);
};

export const getTweetById = async (id: string) => {
  return request.get<Tweet>(`/tweets/getById/${id}`);
};
