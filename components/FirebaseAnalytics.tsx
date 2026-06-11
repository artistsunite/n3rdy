'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { app } from '@/lib/firebase';

export default function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Analytics only runs in browser and in production
    if (typeof window === 'undefined') return;

    import('firebase/analytics').then(({ getAnalytics, logEvent, isSupported }) => {
      isSupported().then((supported) => {
        if (!supported) return;
        const analytics = getAnalytics(app);
        logEvent(analytics, 'page_view', { page_path: pathname });
      });
    });
  }, [pathname]);

  return null;
}
