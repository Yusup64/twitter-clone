import request from '@/libs/request';
import { Tweet } from '@/types/tweet';

const PREFIX = '/bookmarks';

/**
 * 获取当前用户的所有书签
 *
 * @returns Promise 包含书签中的推文列表
 */
export const getBookmarks = async () => {
  const response = await request.get<Tweet[]>(PREFIX);

  return response;
};

/**
 * 将推文添加到书签
 *
 * @param tweetId 要添加到书签的推文ID
 * @returns Promise 包含添加结果
 */
export const addBookmark = async (tweetId: string) => {
  const response = await request.post(`${PREFIX}/${tweetId}`);

  return response;
};

/**
 * 从书签中移除推文
 *
 * @param tweetId 要从书签中移除的推文ID
 * @returns Promise 包含移除结果
 */
export const removeBookmark = async (tweetId: string) => {
  const response = await request.delete(`${PREFIX}/${tweetId}`);

  return response;
};

/**
 * 检查推文是否已添加到书签
 *
 * @param tweetId 要检查的推文ID
 * @returns Promise 包含检查结果，是否已添加到书签
 */
export const checkBookmarked = async (tweetId: string) => {
  try {
    // 获取所有书签并检查是否包含指定推文
    const bookmarks = await getBookmarks();
    const tweets = bookmarks.data || bookmarks;

    if (Array.isArray(tweets)) {
      return tweets.some((tweet) => tweet.id === tweetId);
    }

    return false;
  } catch (error) {
    console.error('检查书签状态失败:', error);

    return false;
  }
};
