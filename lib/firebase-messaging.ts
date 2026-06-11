import { app } from './firebase';

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const { getMessaging, getToken } = await import('firebase/messaging');
  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
  });

  return token;
}

export async function onForegroundMessage(callback: (payload: unknown) => void) {
  if (typeof window === 'undefined') return;
  const { getMessaging, onMessage } = await import('firebase/messaging');
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
