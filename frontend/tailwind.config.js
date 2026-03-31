/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mark Cuban Cost Plus Drugs teal
        'cplus-teal':    '#00A896',
        'cplus-teal-dk': '#007A6D',
        // Deep blue — primary UI chrome
        'navy':          '#0D1F4C',
        'navy-lt':       '#1A3468',
        // Emergency red
        'emergency':     '#C0392B',
        'emergency-dk':  '#96281B',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};
