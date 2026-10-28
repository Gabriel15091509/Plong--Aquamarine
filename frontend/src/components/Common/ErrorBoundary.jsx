import React from "react";
import { FiAlertTriangle, FiHome, FiRefreshCw } from "react-icons/fi";

// Filet de sécurité global : sans lui, une erreur JS pendant le rendu d'UNE
// page (ex. PlongeeDetails) démonte TOUT l'arbre React — Sidebar, Header,
// routeur compris — et plus aucun lien ne répond ensuite, même vers une
// route qui n'a rien à voir avec la page cassée (seul un rechargement
// complet du navigateur "répare" quelque chose, en repartant de zéro).
// Placé dans Layout.jsx autour de {children} et remonté à chaque changement
// de page (`key={layoutKey}`, voir Layout.jsx) : Sidebar/Header restent
// toujours montés en dehors de cette limite, et une page qui plante n'empêche
// plus de naviguer ailleurs — la limite suivante repart d'un état neuf.
//
// Les error boundaries n'existent qu'en composant classe (pas d'équivalent
// hooks à ce jour) : react ne rattrape une erreur de rendu que via
// componentDidCatch/getDerivedStateFromError.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // console.error (et non console.log) : c'est ce qui doit enfin apparaître
    // en rouge dans la console si une page "n'affiche rien" — jusqu'ici,
    // sans cette limite, l'erreur pouvait démonter l'app avant même qu'un
    // message clair n'ait le temps d'être lu.
    console.error("Erreur de rendu interceptée par ErrorBoundary :", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
          <FiAlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Cette page a rencontré une erreur
        </h3>
        {/* Jamais this.state.error.message : c'est un message JS brut
            (souvent en anglais, parfois révélateur d'un détail interne —
            "Cannot read properties of undefined (reading 'map')"), pas un
            message pensé pour un adhérent/moniteur. Même convention que
            ErrorState.jsx pour les erreurs de chargement — le détail réel
            reste dans la console via componentDidCatch ci-dessus, pour le
            diagnostic. */}
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Réessayez, ou contactez le club si le problème persiste.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
          >
            <FiRefreshCw className="w-4 h-4" />
            Recharger la page
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors duration-150"
          >
            <FiHome className="w-4 h-4" />
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
