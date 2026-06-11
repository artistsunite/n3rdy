'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Activity, Shield } from 'lucide-react';
import { Suspense } from 'react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/dashboard';

  return (
    <div className="min-h-screen bg-n3-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(0,229,255,0.06) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl border border-n3-primary/40 flex items-center justify-center shadow-glow-sm">
            <Activity size={20} className="text-n3-primary" />
          </div>
          <div>
            <div className="font-mono font-bold text-n3-text text-xl tracking-wider">N3RDY</div>
            <div className="text-[10px] font-mono text-n3-muted tracking-widest uppercase">Market Intelligence</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-n3-border bg-n3-card p-8 shadow-card">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-n3-text mb-2">Operator Access</h1>
            <p className="text-sm text-n3-muted">Sign in to control your N3RDY intelligence bot</p>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            <span className="text-sm">Continue with Google</span>
          </button>

          <div className="mt-6 pt-6 border-t border-n3-border flex items-center justify-center gap-2 text-xs text-n3-muted">
            <Shield size={12} />
            <span>Restricted to authorized operators</span>
          </div>
        </div>

        <p className="text-center text-xs text-n3-muted mt-6">
          Powered by Claude Fable 5 · N3RDY v2.0
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-n3-bg" />}>
      <LoginContent />
    </Suspense>
  );
}
