import React from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

// Affichage générique d'une erreur de chargement (requête React Query en
// échec) — jamais le message technique brut (error.message : "Network
// Error", "timeout of 30000ms exceeded", "Request failed with status code
// 500"...), qui ne dit rien d'utile à un adhérent/moniteur et ressemble à un
// bug interne. Le détail réel reste disponible dans la console (React Query
// le logge déjà) pour le diagnostic.
const ErrorState = ({
  title = "Chargement impossible",
  message = "Une erreur est survenue. Vérifiez votre connexion et réessayez dans un instant.",
  onRetry,
}) => (
  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
    <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
      <FiAlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
      {message}
    </p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <FiRefreshCw className="w-4 h-4" />
        Réessayer
      </button>
    )}
  </div>
);

export default ErrorState;
