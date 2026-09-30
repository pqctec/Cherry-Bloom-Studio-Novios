/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta cálida de boda: marfil, arena, rubor, terracota y dorado.
        crema: '#FBF6EF',
        arena: { DEFAULT: '#F3E8DA', 200: '#EADBC8', 300: '#DCC7AE' },
        rubor: { DEFAULT: '#EFD3C8', 100: '#F8E9E3', 300: '#E3B8A8' },
        rosa: { DEFAULT: '#C4826F', 600: '#AE6A57' },
        terracota: { DEFAULT: '#A8553A', 700: '#8E4530', 800: '#733624' },
        oro: { DEFAULT: '#B8924A', 300: '#D9BE86', 100: '#F4EAD5' },
        cacao: { DEFAULT: '#3E2A23', 700: '#5A423A', 500: '#8A736A', 300: '#BBA99F' },
        salvia: { DEFAULT: '#7E8E6E', 100: '#E7ECE0' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        suave: '0 10px 30px -12px rgba(62, 42, 35, 0.25)',
      },
    },
  },
  plugins: [],
}
