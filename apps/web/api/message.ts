import request from '@/libs/request';
import { Message, Conversation, User } from '@/types/message';

const PREFIX = '/messages';

export const getConversations = () => {
  return request.get<Conversation[]>(`${PREFIX}/conversations`);
};

export const getFollowingUsers = () => {
  return request.get<User[]>(`${PREFIX}/following`);
};

export const getMessages = (userId: string) => {
  return request.get<Message[]>(`${PREFIX}/${userId}`);
};

export const sendMessage = (userId: string, content: string) => {
  return request.post<Message>(`${PREFIX}/${userId}`, { content });
};

export const markAsRead = (conversationId: string) => {
  return request.post(`${PREFIX}/read/${conversationId}`);
};

export const deleteMessage = (messageId: string) => {
  return request.delete<{ success: boolean }>(`${PREFIX}/${messageId}`);
};
