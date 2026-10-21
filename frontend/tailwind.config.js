/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        vellora: {
          // Primary Brand - Navy
          navy: '#172554',
          'navy-deep': '#172554',
          'navy-midnight': '#1E3A5F',
          'navy-royal': '#2563A6',
          'navy-soft': '#DCEBFF',
          'navy-pale': '#EFF6FF',

          // Analytics - Sky Blue
          sky: '#69BFF5',
          'sky-strong': '#69BFF5',
          'sky-light': '#A9DFFF',
          'sky-soft': '#D8F0FF',
          'sky-pale': '#EFF9FF',

          // Data Quality - Mint Green
          mint: '#168F79',
          'mint-deep': '#168F79',
          'mint-fresh': '#42BFA3',
          'mint-soft': '#BDEFE0',
          'mint-pale': '#E3F8EE',

          // Data Science - Lavender
          lavender: '#7665B5',
          'lavender-deep': '#7665B5',
          'lavender-medium': '#A99AE8',
          'lavender-soft': '#DCD4FF',
          'lavender-pale': '#F2EEFF',

          // Insights - Peach and Coral
          coral: '#D87563',
          'coral-deep': '#D87563',
          'coral-warm': '#F29A87',
          peach: '#FFD8C5',
          'peach-soft': '#FFD8C5',
          'peach-pale': '#FFF0E6',

          // Projects - Blush Pink
          rose: '#B84F79',
          'rose-deep': '#B84F79',
          'rose-pink': '#E68BB3',
          pink: '#F8C9DC',
          'pink-soft': '#F8C9DC',
          'pink-pale': '#FFF0F6',

          // Highlights & Approvals - Golden Yellow
          amber: '#B7791F',
          'amber-deep': '#B7791F',
          gold: '#E9B949',
          'gold-warm': '#E9B949',
          yellow: '#FFE7A3',
          'yellow-soft': '#FFE7A3',
          cream: '#FFF8DC',
          'cream-pale': '#FFF8DC',

          // Global Background & Neutrals - Warm Cream
          'bg-cream': '#FFF9F0',
          ivory: '#FFFDF8',
          beige: '#F6E8D5',
          sand: '#E9D5B5',

          // Contrast & Typography
          ink: '#18233B',
          slate: '#43516A',
          muted: '#718096',
          border: '#E4E7EF',
          'border-subtle': '#F0F2F7',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'pastel-sm': '0 2px 8px -1px rgba(23, 37, 84, 0.04), 0 1px 3px 0 rgba(23, 37, 84, 0.02)',
        'pastel-md': '0 6px 18px -2px rgba(23, 37, 84, 0.06), 0 2px 6px -1px rgba(23, 37, 84, 0.03)',
        'pastel-lg': '0 12px 30px -4px rgba(23, 37, 84, 0.08), 0 4px 10px -2px rgba(23, 37, 84, 0.03)',
        'pastel-hover': '0 14px 34px -4px rgba(23, 37, 84, 0.10), 0 6px 14px -2px rgba(23, 37, 84, 0.04)',
      },
      borderRadius: {
        'card': '18px',
      },
    },
  },
  plugins: [],
};
