'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoogleSyncBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('google-sync-dismissed');
    if (!dismissed) {
      // Check if already connected
      fetch('/api/google/status')
        .then(r => r.json())
        .then(d => { if (!d.connected) setVisible(true); })
        .catch(() => { /* show by default if route doesn't exist yet */ setVisible(true); });
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem('google-sync-dismissed', '1');
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="liquid-glass-card rounded-xl px-4 py-3 flex items-center gap-3"
        >
          {/* Google G icon */}
          <div className="w-5 h-5 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Sync Google Calendar</p>
            <p className="text-xs text-white/50">Show your personal events alongside marketing dates</p>
          </div>
          <a
            href="/api/google/authorize?scope=calendar"
            className="text-xs bg-n3-primary text-n3-bg px-3 py-1.5 rounded-lg font-semibold hover:bg-n3-primary/90 transition-colors flex-shrink-0"
          >
            Connect ↗
          </a>
          <button onClick={dismiss} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
