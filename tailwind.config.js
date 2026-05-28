/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      animation: {
        'fade-in':       'fadeIn 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-right':   'slideRight 0.38s cubic-bezier(0.16,1,0.3,1) both',
        'kpi-in':        'kpiIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'view-enter':    'viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'blink':         'blink 1.2s step-end infinite',
        'float':         'float 3s ease-in-out infinite',
        'shimmer-once':  'shimmerOnce 0.6s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        kpiIn: {
          '0%':   { opacity: '0', transform: 'translateY(24px) scale(0.94)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        viewEnter: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmerOnce: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'brand': '0 4px 14px 0 rgb(99 102 241 / 0.4)',
      }
    },
  },
  plugins: [],
}

