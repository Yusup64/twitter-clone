import request from '@/libs/request';
import { Notification } from '@/types/notification';

const PREFIX = '/notifications';

export const getNotifications = () => {
  return request.get<Notification[]>(PREFIX);
};

export const markAsRead = (notificationId: string) => {
  return request.post(`${PREFIX}/${notificationId}/read`);
};

export const markAllAsRead = () => {
  return request.post(`${PREFIX}/read-all`);
};
