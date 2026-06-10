// @type {import('tailwindcss').Config}
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#faf8ff',
        surface: '#ffffff',
        navy: '#0f172a',
        primary: '#006c49',
        emerald: '#10b981',
        indigo: '#4648d4',
        danger: '#ba1a1a',
        ink: '#131b2e',
        muted: '#64748b',
        line: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.05), 0 14px 40px rgba(15, 23, 42, 0.04)',
        pop: '0 18px 42px rgba(15, 23, 42, 0.16)',
      },
    },
  },
  plugins: [],
};
