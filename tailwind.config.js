/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Customizing the "Audit Report" look
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none', // Allows report to fill the sidebar
            color: '#334155', // slate-700
            h1: { color: '#064e3b', fontWeight: '800' }, // emerald-900
            h2: { color: '#065f46', fontWeight: '700' }, // emerald-800
            h3: { color: '#047857', fontWeight: '600' }, // emerald-700
            p: { textAlign: 'justify', lineHeight: '1.6' },
            blockquote: {
              borderLeftColor: '#10b981',
              backgroundColor: '#f8fafc',
              padding: '10px 20px',
              borderRadius: '8px',
            },
            code: {
              color: '#059669',
              backgroundColor: '#ecfdf5',
              padding: '2px 4px',
              borderRadius: '4px',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}