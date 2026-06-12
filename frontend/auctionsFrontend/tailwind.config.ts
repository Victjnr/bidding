import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D2137',
          light: '#1E3A5F',
          dark: '#070F1A',
        },
        orange: {
          DEFAULT: '#E8540A',
          light: '#F4854A',
          dark: '#B83D07',
        },
        sky: {
          DEFAULT: '#EBF4FD',
          dark: '#C7DFF7',
        },
        border: '#BFD0E4',
        ink: '#111827',
        muted: '#6B7A8D',
        success: '#16A34A',
        error: '#DC2626',
        warning: '#D97706',
      },
      fontFamily: {
        display: ['DM Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-orange': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 84, 10, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 84, 10, 0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-orange': 'pulse-orange 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
