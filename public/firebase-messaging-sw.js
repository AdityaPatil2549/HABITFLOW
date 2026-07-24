// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of your public directory (public/firebase-messaging-sw.js)
// It handles background push messages when the app tab is closed.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values must match your firebase config
firebase.initializeApp({
  apiKey: 'AIzaSyDSsWuavPh1HEItdsrlxWoIhXli94fT5Tg',
  authDomain: 'habitflow-1.firebaseapp.com',
  projectId: 'habitflow-1',
  storageBucket: 'habitflow-1.firebasestorage.app',
  messagingSenderId: '115144174334',
  appId: '1:115144174334:web:6f51e26058ad0ac6e913af',
});

const messaging = firebase.messaging();

// Handle background messages (when the app tab is NOT focused)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'HabitFlow';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open or focus the app tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
