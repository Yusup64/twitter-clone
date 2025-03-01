import { io, Socket } from 'socket.io-client';

import { getToken } from './auth';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket) return socket;

  const token = getToken();

  if (!token) return null;

  const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    socket = null;
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }

  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToNotifications = (
  callback: (notification: any) => void,
) => {
  const socket = getSocket();

  if (!socket) return () => {};

  socket.on('notification', callback);

  return () => {
    socket.off('notification', callback);
  };
};
