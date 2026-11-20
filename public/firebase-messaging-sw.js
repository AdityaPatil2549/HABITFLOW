// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of your public directory (public/firebase-messaging-sw.js)
// It handles background push messages when the app tab is closed.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker dynamically from query params
// to prevent hardcoding plaintext API credentials in static public assets.
const swUrl = new URL(self.location.href);
const configParam = swUrl.searchParams.get('config');
let firebaseConfig = null;

if (configParam) {
  try {
    firebaseConfig = JSON.parse(decodeURIComponent(configParam));
  } catch (e) {
    console.warn('[FCM SW] Failed to parse config query param:', e);
  }
}

if (firebaseConfig && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = typeof firebase !== 'undefined' && firebase.apps.length ? firebase.messaging() : null;

// Handle background messages (when the app tab is NOT focused)
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
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
}

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
