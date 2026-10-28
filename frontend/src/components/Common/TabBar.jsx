import React from "react";
import { Link, useLocation } from "react-router-dom";

// Barre d'onglets générique pour basculer entre les vues d'une même page
// (ex. "Toutes les adhésions" / "Validation") sans quitter la page — chaque
// onglet est un <Link> vers l'URL (avec ?query) que ces vues utilisaient
// déjà via les anciens sous-menus dépliables de la Sidebar (voir
// Sidebar.jsx) : zéro changement à la logique de dérivation d'état
// existante (useSearchParams + useEffect dans chaque liste), seulement un
// nouveau déclencheur visuel en remplacement du lien sidebar supprimé.
// Style "onglets soulignés", volontairement distinct du toggle grille/liste
// déjà en pilule ailleurs dans ces mêmes pages, pour ne pas les confondre.
const TabBar = ({ tabs }) => {
  const location = useLocation();
  const currentUrl = `${location.pathname}${location.search}`;

  // Rien à basculer (rôle ne donnant droit qu'à la vue par défaut) : pas de
  // barre du tout, comme l'absence de `children` sur l'ancien menu sidebar.
  if (!tabs || tabs.length < 2) return null;

  return (
    <div
      role="tablist"
      // flex-wrap plutôt qu'un défilement horizontal (overflow-x-auto) :
      // avec 4 onglets aux libellés longs (ex. groupe Sorties — "Sorties
      // que j'encadre", "Carte des sites", "Incidents"), un simple scroll
      // sans indice visuel laissait les derniers onglets coupés hors écran
      // sur mobile (~390px), invisibles et donc perçus comme absents/
      // cassés. Ici les onglets qui ne tiennent pas repassent sur une
      // deuxième ligne — tous restent visibles et cliquables d'un coup
      // d'œil, sans geste de défilement à découvrir.
      className="flex flex-wrap items-center gap-1"
    >
      {tabs.map((tab) => {
        const isActive = currentUrl === tab.to;
        const badgeCount =
          tab.badge > 0 ? (tab.badge > 99 ? "99+" : tab.badge) : null;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            role="tab"
            aria-selected={isActive}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "text-cyan-700 dark:text-cyan-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {badgeCount && (
              <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {badgeCount}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-cyan-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default TabBar;
