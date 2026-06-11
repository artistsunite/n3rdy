importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCQWVfRnGMa4BF-Ybc_ua3rBJTClZzNdW8",
  authDomain: "n3rdy-499023.firebaseapp.com",
  projectId: "n3rdy-499023",
  storageBucket: "n3rdy-499023.firebasestorage.app",
  messagingSenderId: "990208661427",
  appId: "1:990208661427:web:f6ead51467a2fd1e629dc6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'N3RDY Intelligence';
  const body = payload.notification?.body || 'New market briefing available';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'n3rdy-brief',
    renotify: true,
    data: { url: payload.data?.url || '/dashboard' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
