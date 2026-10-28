
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Inter est déjà chargée (@import Google Fonts dans index.css) mais
      // sans ceci, `font-sans` retombait sur la pile système par défaut de
      // Tailwind (ui-sans-serif...) — la police était donc téléchargée pour
      // rien, jamais réellement appliquée. Pile de repli conservée en
      // totalité pour un rendu correct tant qu'Inter charge (connexion
      // lente, hors-ligne avant mise en cache).
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        // Réservée à l'habillage éditorial "site vitrine" (AboutPage /
        // PublicAboutPage) : une serif chaleureuse pour les titres, jamais
        // utilisée dans le reste de l'application (formulaires, tableaux...)
        // qui reste entièrement en font-sans. Même pile de repli que
        // font-sans si Google Fonts ne charge pas.
        display: [
          '"Fraunces"',
          "ui-serif",
          "Georgia",
          '"Times New Roman"',
          "serif",
        ],
      },
      colors: {
        // Accent chaleureux de la page vitrine (corail — écho littéral aux
        // récifs coralliens du texte), distinct de primary/ocean qui restent
        // la palette de TOUTE l'application : ne pas réutiliser ailleurs
        // sans une raison consciente, pour que ce corail reste identifiant
        // de la vitrine plutôt que dilué partout.
        coral: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#fecdaa',
          300: '#fdad74',
          400: '#fb8a3c',
          500: '#f66d1a',
          600: '#e75410',
          700: '#c03e10',
          800: '#983215',
          900: '#7b2b14',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
