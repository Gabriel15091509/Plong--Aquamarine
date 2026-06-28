const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 MIGRATION DE CREATE REACT APP VERS VITE\n');
console.log('='.repeat(50));

const frontendPath = path.join(__dirname, 'frontend');

// ==================== ÉTAPE 1: SAUVEGARDE ====================
console.log('\n📦 Étape 1/5: Sauvegarde...');

const packageJsonPath = path.join(frontendPath, 'package.json');
const packageJsonBackup = path.join(frontendPath, 'package.json.backup');

if (fs.existsSync(packageJsonPath)) {
  fs.copyFileSync(packageJsonPath, packageJsonBackup);
  console.log('✅ Package.json sauvegardé');
}

// ==================== ÉTAPE 2: PACKAGE.JSON ====================
console.log('\n📦 Étape 2/5: Mise à jour du package.json...');

const newPackageJson = {
  "name": "plongee-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@tanstack/react-query": "^4.29.19",
    "@tanstack/react-query-devtools": "^4.29.19",
    "axios": "^1.4.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.12.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^4.12.0",
    "react-router-dom": "^6.14.2",
    "recharts": "^2.7.2"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write src/**/*.{js,jsx,css}"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
};

fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
console.log('✅ package.json mis à jour');

// ==================== ÉTAPE 3: FICHIERS DE CONFIGURATION ====================
console.log('\n📦 Étape 3/5: Création des fichiers de configuration...');

// vite.config.js
const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
`;

fs.writeFileSync(path.join(frontendPath, 'vite.config.js'), viteConfig);
console.log('✅ vite.config.js créé');

// index.html à la racine
const indexHtml = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/aqua.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0ea5e9" />
    <meta name="description" content="Application de gestion de club de plongée" />
    <title>Plongée Club</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

fs.writeFileSync(path.join(frontendPath, 'index.html'), indexHtml);
console.log('✅ index.html créé');

// main.jsx
const mainJsx = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { ThemeProvider } from './context/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
`;

fs.writeFileSync(path.join(frontendPath, 'src', 'main.jsx'), mainJsx);
console.log('✅ main.jsx créé');

// .env
const envContent = `
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
`;

fs.writeFileSync(path.join(frontendPath, '.env'), envContent);
console.log('✅ .env créé');

// tailwind.config.js
const tailwindConfig = `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
`;

fs.writeFileSync(path.join(frontendPath, 'tailwind.config.js'), tailwindConfig);
console.log('✅ tailwind.config.js mis à jour');

// postcss.config.js
const postcssConfig = `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

fs.writeFileSync(path.join(frontendPath, 'postcss.config.js'), postcssConfig);
console.log('✅ postcss.config.js créé');

// ==================== ÉTAPE 4: MISE À JOUR DES IMPORTS ====================
console.log('\n📦 Étape 4/5: Mise à jour des imports...');

// api.js
const apiPath = path.join(frontendPath, 'src', 'services', 'api.js');
if (fs.existsSync(apiPath)) {
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  // Remplacer process.env par import.meta.env
  apiContent = apiContent.replace(
    /process\.env\.REACT_APP_API_URL/g,
    'import.meta.env.VITE_API_URL'
  );
  fs.writeFileSync(apiPath, apiContent);
  console.log('✅ api.js mis à jour');
}

// ==================== ÉTAPE 5: NETTOYAGE ET INSTALLATION ====================
console.log('\n📦 Étape 5/5: Nettoyage et installation...');

// Supprimer les fichiers inutiles
const filesToDelete = [
  path.join(frontendPath, 'public'),
  path.join(frontendPath, 'src', 'index.js'),
  path.join(frontendPath, 'src', 'setupTests.js'),
  path.join(frontendPath, 'src', 'reportWebVitals.js'),
];

filesToDelete.forEach(file => {
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      fs.rmSync(file, { recursive: true, force: true });
    } else {
      fs.unlinkSync(file);
    }
  }
});
console.log('✅ Fichiers inutiles supprimés');

console.log('\n' + '='.repeat(50));
console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !\n');
console.log('📦 Étapes suivantes :');
console.log('   1. cd frontend');
console.log('   2. npm install');
console.log('   3. npm run dev');
console.log('\n📝 Note: Vérifiez que votre backend tourne sur le port 5000');
console.log('   http://localhost:5000\n');