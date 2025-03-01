import request from '@/libs/request';

const PREFIX = '/notifications';

export const getNotifications = async (params?: any) => {
  return request.get(`${PREFIX}`, params);
};

export const markAsRead = async (notificationId: string) => {
  return request.post(`${PREFIX}/${notificationId}/read`);
};

export const markAllAsRead = async () => {
  return request.post(`${PREFIX}/read-all`);
};

export const getUnreadCount = async () => {
  return request.get(`${PREFIX}/unread-count`);
};
