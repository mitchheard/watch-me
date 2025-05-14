// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',  // ✅ picks up most source files
      './app/**/*.{js,ts,jsx,tsx,mdx}',  // ✅ if you're using the /app directory
      './components/**/*.{js,ts,jsx,tsx,mdx}', // ✅ all shared UI components
    ],
    darkMode: 'class',
    theme: {
      extend: {},
    },
    plugins: [],
  };
  