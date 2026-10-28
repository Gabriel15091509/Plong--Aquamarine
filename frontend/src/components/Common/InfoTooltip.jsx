import React from "react";

// Petite étiquette d'aide affichée au survol (souris) ou au focus (clavier)
// d'un élément — sert notamment à expliquer ce que représente vraiment un
// pourcentage du dashboard (StatsCard : badge de tendance et valeurs en %)
// sans l'écrire en permanence sur la carte. Toujours en fond sombre,
// indépendant du thème clair/sombre de la page (comme la plupart des
// tooltips), pour rester lisible sur les deux fonds.
const InfoTooltip = ({ label, children, className = "" }) => {
  if (!label) return children;

  return (
    <span
      tabIndex={0}
      className={`relative inline-flex items-center outline-none cursor-help rounded focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 group/tooltip ${className}`}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 dark:bg-black px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-visible/tooltip:opacity-100"
      >
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-black" />
      </span>
    </span>
  );
};

export default InfoTooltip;
