// import Firebase core module
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js',
);

// Config Firebase - directly use environment variable values
const firebaseConfig = {
  apiKey: 'AIzaSyDMW7b2AMODcwx4x8eHUpeDmv2KaKBQq70',
  authDomain: 'social-media-99955.firebaseapp.com',
  projectId: 'social-media-99955',
  storageBucket: 'social-media-99955.firebasestorage.app',
  messagingSenderId: '693685351605',
  appId: '1:693685351605:web:4c7c865049108adcc7bafc',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Messaging instance
const messaging = firebase.messaging();

// Set background message handler
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Background message received',
    payload,
  );

  // Custom notification options
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/icons/icon-192x192.png', // Ensure this path exists
    badge: '/icons/icon-72x72.png', // Optional badge icon
    data: payload.data, // Pass any additional data
    tag: 'notification', // Notification tag, same tag notifications will replace previous ones
    requireInteraction: true, // Notification will stay until user interacts
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});

// Click notification handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);

  // Get notification data
  const notification = event.notification;
  const data = notification.data || {};

  // Close notification
  event.notification.close();

  // Handle click, e.g. open specific page
  // Here, decide which URL to navigate to based on notification data
  let url = '/';

  if (data.url) {
    url = data.url;
  }

  // Open or focus page
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if any window is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
