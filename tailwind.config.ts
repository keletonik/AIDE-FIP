import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cold-cupboard palette: high contrast, no eye-strain on a phone in the dark.
        ink:    '#0b0d10',
        slate:  '#171a1f',
        line:   '#262a31',
        muted:  '#8c95a3',
        body:   '#d6dae2',
        head:   '#f3f5f8',
        amber:  '#f5a623',
        warn:   '#e2462f',
        ok:     '#2ea44f',
        link:   '#7aa7ff',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
