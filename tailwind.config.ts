import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        n3: {
          bg: '#050816',
          card: '#0B1220',
          border: '#1E293B',
          primary: '#00E5FF',
          success: '#00FF88',
          warning: '#FFC857',
          danger: '#FF4D6D',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'ticker': 'ticker 50s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'scan': 'scan 3s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'bar-fill': 'barFill 1.2s ease-out forwards',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0,229,255,0.2), 0 0 30px rgba(0,229,255,0.08)' },
          '50%': { boxShadow: '0 0 25px rgba(0,229,255,0.4), 0 0 50px rgba(0,229,255,0.15)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        barFill: {
          from: { width: '0%' },
          to: { width: 'var(--bar-width)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(0,229,255,0.25)',
        'glow-md': '0 0 24px rgba(0,229,255,0.35)',
        'glow-lg': '0 0 48px rgba(0,229,255,0.4)',
        'glow-success': '0 0 20px rgba(0,255,136,0.35)',
        'glow-warning': '0 0 20px rgba(255,200,87,0.35)',
        'glow-danger': '0 0 20px rgba(255,77,109,0.35)',
        'card': '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'grid-dark': `linear-gradient(rgba(30,41,59,0.35) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,41,59,0.35) 1px, transparent 1px)`,
        'radial-glow': 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 65%)',
        'radial-glow-hero': 'radial-gradient(ellipse at 60% 50%, rgba(0,229,255,0.06) 0%, transparent 55%)',
      },
      backgroundSize: {
        'grid-dark': '80px 80px',
      },
    },
  },
  plugins: [],
};

export default config;
