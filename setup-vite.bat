@echo off
echo 🚀 Migration vers Vite...

cd frontend

echo 📦 Suppression de node_modules...
rmdir /s /q node_modules
del package-lock.json

echo 📦 Installation des dépendances...
npm install

echo 📦 Installation des dépendances de développement...
npm install -D @vitejs/plugin-react vite eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier

echo 🎨 Configuration de Tailwind...
npx tailwindcss init -p

echo 🚀 Lancement de l'application...
npm run dev

pause