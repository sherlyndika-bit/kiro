/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand (Sudut Ruang green) ──────────────────────────────
        brand: {
          DEFAULT: '#1A3A2E',
          dark: '#0E2318',
          mid: '#2D6A50',
          accent: '#3DB87A',
          soft: '#E6F4EE',
        },
        accent: {
          DEFAULT: '#3DB87A',
          soft: '#E6F4EE',
        },
        amber: { DEFAULT: '#E8A020', soft: '#FEF3DC' },
        blue: { DEFAULT: '#2563EB', soft: '#EEF4FF' },
        coral: { DEFAULT: '#D95B35', soft: '#FDF0EB' },
        purple: { DEFAULT: '#6B48D4', soft: '#F1EEFF' },

        // ── Semantic tokens (remapped to the green system so existing
        //    Material-style class names keep working) ────────────────
        background: '#F4F7F5',
        surface: '#FFFFFF',
        'surface-bright': '#FFFFFF',
        'surface-dim': '#E3EBE7',
        'surface-variant': '#E6F4EE',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F4F7F5',
        'surface-container': '#EBF1EE',
        'surface-container-high': '#E3EBE7',
        'surface-container-highest': '#DCE6E0',
        'surface-tint': '#2D6A50',

        'on-background': '#0F1A14',
        'on-surface': '#0F1A14',
        'on-surface-variant': '#3D5247',

        outline: '#6E8A7C',
        'outline-variant': '#D5E0DA',

        primary: '#1A3A2E',
        'on-primary': '#FFFFFF',
        'primary-container': '#1A3A2E',
        'on-primary-container': '#E6F4EE',
        'primary-fixed': '#CDE7DA',
        'primary-fixed-dim': '#A9D6BE',
        'on-primary-fixed': '#0E2318',
        'on-primary-fixed-variant': '#2D6A50',
        'inverse-primary': '#A9D6BE',

        secondary: '#2D6A50',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#E6F4EE',
        'on-secondary-container': '#1A3A2E',
        'secondary-fixed': '#E6F4EE',
        'secondary-fixed-dim': '#A9D6BE',
        'on-secondary-fixed': '#0E2318',
        'on-secondary-fixed-variant': '#2D6A50',

        tertiary: '#E8A020',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#FEF3DC',
        'on-tertiary-container': '#7A5710',
        'tertiary-fixed': '#FEF3DC',
        'tertiary-fixed-dim': '#F4D79A',
        'on-tertiary-fixed': '#7A5710',
        'on-tertiary-fixed-variant': '#7A5710',

        error: '#BA1A1A',
        'on-error': '#FFFFFF',
        'error-container': '#FFDAD6',
        'on-error-container': '#93000A',

        'inverse-surface': '#2D3133',
        'inverse-on-surface': '#EFF1F3',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        full: '9999px',
      },
      spacing: {
        base: '4px',
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
        gutter: '24px',
        'container-max': '1440px',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        'body-lg': ['DM Sans', 'sans-serif'],
        'body-md': ['DM Sans', 'sans-serif'],
        'headline-sm': ['DM Sans', 'sans-serif'],
        'headline-md-mobile': ['DM Sans', 'sans-serif'],
        'headline-md': ['DM Serif Display', 'serif'],
        'display-lg': ['DM Serif Display', 'serif'],
        'mono-label': ['JetBrains Mono', 'monospace'],
        'label-caps': ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'headline-md-mobile': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'display-lg': ['30px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'mono-label': ['13px', { lineHeight: '16px', fontWeight: '500' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '600' }],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(14,35,24,0.06), 0 4px 16px rgba(14,35,24,0.04)',
        'soft-md': '0 2px 8px rgba(14,35,24,0.08), 0 8px 32px rgba(14,35,24,0.06)',
      },
      keyframes: {
        'scale-up': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'scale-up': 'scale-up 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
