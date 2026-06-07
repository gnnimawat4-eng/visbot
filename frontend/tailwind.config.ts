import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Override gray with zinc — eliminates blue-gray tint in dark mode */
        gray: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        /* Brand — used only for logo + primary CTAs */
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#16a34a',  /* green-600 — matches --vb-accent */
          600: '#15803d',  /* green-700 — matches --vb-accent-hover */
          700: '#166534',
          900: '#14532d',
        },
        /* Neutral zinc for UI chrome */
        zinc: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },
      screens: {
        'phone':       '375px',
        'phone-lg':    '414px',
        'tablet':      '768px',
        'tablet-lg':   '1024px',
        'laptop':      '1280px',
        'desktop':     '1536px',
        'mobile-only': { max: '767px' },
        'tablet-only': { min: '768px', max: '1023px' },
        'desktop-only': { min: '1024px' },
        'touch': { raw: '(hover: none) and (pointer: coarse)' },
        'mouse': { raw: '(hover: hover) and (pointer: fine)' },
      },
      spacing: {
        'touch':       '44px',
        'touch-lg':    '56px',
        'safe-top':    'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      borderRadius: {
        sm:  '0.25rem',   /* 4px */
        md:  '0.375rem',  /* 6px  ← default for inputs/buttons */
        lg:  '0.5rem',    /* 8px  ← default for cards */
        xl:  '0.75rem',   /* 12px */
        '2xl': '1rem',    /* 16px — rarely */
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'var(--font-mono)', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',    { lineHeight: '1rem' }],
        sm:   ['0.875rem',   { lineHeight: '1.25rem' }],
        base: ['0.9375rem',  { lineHeight: '1.5rem' }],   /* 15px — more refined than 16 */
        lg:   ['1.0625rem',  { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',    { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',     { lineHeight: '2rem' }],
        '3xl':['1.875rem',   { lineHeight: '2.25rem' }],
        '4xl':['2.25rem',    { lineHeight: '2.5rem' }],
      },
      minHeight: { touch: '44px' },
      minWidth:  { touch: '44px' },
    },
  },
  plugins: [],
}
export default config
