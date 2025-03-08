import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

import firebaseConfig from './firebaseConfig';

// Initialize Firebase app (if not already initialized)
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get messaging service instance
export const getMessagingInstance = () => {
  try {
    // Ensure only executed on client
    if (typeof window !== 'undefined') {
      return getMessaging(firebaseApp);
    }

    return null;
  } catch (error) {
    console.error('Failed to get Firebase Messaging instance:', error);

    return null;
  }
};

// 请求通知权限并获取FCM令牌
export const requestNotificationsPermission = async () => {
  try {
    // Ensure only executed on client
    if (typeof window === 'undefined') return null;

    const messaging = getMessagingInstance();

    if (!messaging) return null;

    // Request notification permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');

      return null;
    }

    // Get FCM token - use custom service worker instead of default
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js',
      ),
    });

    if (currentToken) {
      console.log('FCM token:', currentToken);

      // Send token to backend server
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/register-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // 假设使用JWT
            },
            body: JSON.stringify({ token: currentToken }),
          },
        );
        console.log('FCM token successfully registered on server');
      } catch (error) {
        console.error('Failed to register FCM token on server:', error);
      }

      return currentToken;
    } else {
      console.error('Failed to get FCM token');

      return null;
    }
  } catch (error) {
    console.error(
      'Failed to request notification permission or get FCM token:',
      error,
    );

    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    const messaging = getMessagingInstance();

    if (!messaging) {
      resolve(null);

      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      resolve(payload);
    });
  });
};
