import React from "react";

// Écran de chargement générique (composants gris qui pulsent), utilisé
// partout où une page/section attend ses données — même langage visuel
// que l'aperçu du tableau de bord affiché pendant la transition de
// connexion (src/pages/Auth/LoginPage.jsx), pour rester cohérent dans
// toute l'application plutôt que d'afficher un spinner isolé.
const LoadingSpinner = ({ size = "md" }) => {
  if (size === "sm") {
    return (
      <div className="w-full max-w-xs space-y-2" role="status" aria-label="Chargement en cours">
        <div className="h-3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full py-2 space-y-4" role="status" aria-label="Chargement en cours">
      <div className="h-6 w-40 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
        <div className="h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
        <div className="h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
        <div className="h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
        <div className="h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
      </div>
    </div>
  );
};

export default LoadingSpinner;
