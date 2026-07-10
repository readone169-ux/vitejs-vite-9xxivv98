/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          fluent: {
            blue: '#0078d4',
            'blue-dark': '#106ebe',
            'blue-light': '#deecf9',
            neutral: '#f3f2f1',
            'neutral-dark': '#edebe9',
            'neutral-darker': '#d2d0ce',
            text: '#323130',
            'text-secondary': '#605e5c',
            'text-disabled': '#a19f9d',
            white: '#ffffff',
            black: '#000000',
            red: '#d13438',
            green: '#107c10',
            yellow: '#ffb900',
            orange: '#d83b01',
          },
        },
        fontFamily: {
          fluent: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        },
        boxShadow: {
          'fluent-sm': '0 1.6px 3.6px rgba(0,0,0,0.132), 0 0.3px 0.9px rgba(0,0,0,0.108)',
          'fluent-md': '0 3.2px 7.2px rgba(0,0,0,0.132), 0 0.6px 1.8px rgba(0,0,0,0.108)',
          'fluent-lg': '0 6.4px 14.4px rgba(0,0,0,0.132), 0 1.2px 3.6px rgba(0,0,0,0.108)',
        },
      },
    },
    plugins: [],
  };
  