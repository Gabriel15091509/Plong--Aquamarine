import React from "react";
import { FiSun, FiCloud, FiCloudRain, FiWind, FiAlertTriangle } from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { weatherCodeLabel } from "../../utils/helpers";

// Codes WMO pluie/orage (voir meteoClient.js) : le reste (0-3, brouillard...)
// retombe sur "nuageux" par défaut, cette pastille n'a besoin que de
// distinguer dégagé/nuageux/pluie en un coup d'œil, pas la table complète.
const CODES_PLUIE = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);

function weatherIcon(code) {
  if (code === 0 || code === 1) return FiSun;
  if (CODES_PLUIE.has(code)) return FiCloudRain;
  return FiCloud;
}

// Pastille météo compacte pour une sortie proche (voir le seuil JOURS_METEO_
// BADGE dans SortiesPage.jsx qui décide quand la monter). Reprend
// SortieService.getPrevisionMeteo (même endpoint que l'onglet détaillé de
// SortieDetails.jsx) mais ne montre qu'un repère rapide — icône + vent +
// alerte danger éventuelle — pas les valeurs chiffrées complètes : la fiche
// sortie reste la source de détail. Composant à part (et non un simple bout
// de JSX dans la liste) car useGetMeteo doit être appelé une fois par
// sortie affichée, ce que les règles des Hooks interdisent de faire
// directement dans un .map().
const SortieWeatherBadge = ({ idSortie, variant = "pill", toneClaire = false }) => {
  const { useGetMeteo } = useSorties();
  const { data, isLoading } = useGetMeteo(idSortie);
  const meteo = data?.data;

  // Chargement, pas de position renseignée, ou hors fenêtre de prévision
  // (>16 jours) : rien à montrer plutôt qu'un badge vide ou un skeleton qui
  // ferait sauter la mise en page pour une info secondaire.
  if (isLoading || !meteo?.disponible) return null;

  const Icon = weatherIcon(meteo.forecast?.weathercode);
  const vent =
    meteo.forecast?.windspeed !== null && meteo.forecast?.windspeed !== undefined
      ? `${Math.round(meteo.forecast.windspeed)} km/h`
      : null;
  const titre = [
    weatherCodeLabel(meteo.forecast?.weathercode),
    vent ? `Vent ${vent}` : null,
    meteo.dangereux ? "Conditions jugées dangereuses" : "Conditions favorables",
  ]
    .filter(Boolean)
    .join(" · ");

  const couleur = meteo.dangereux
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";

  if (variant === "inline") {
    // toneClaire : pour un fond systématiquement sombre (ex: le bandeau
    // "Prochaine sortie" du dashboard, bg-slate-800 même en thème clair) où
    // les teintes -600/-400 habituelles (pensées pour un fond clair avec
    // bascule dark:) manqueraient de contraste.
    const couleurTexte = toneClaire
      ? meteo.dangereux
        ? "text-red-300"
        : "text-sky-300"
      : meteo.dangereux
        ? "text-red-600 dark:text-red-400"
        : "text-sky-600 dark:text-sky-400";
    return (
      <span
        className={`flex items-center gap-1 text-xs font-medium ${couleurTexte}`}
        title={titre}
      >
        {meteo.dangereux ? (
          <FiAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        {vent ? `${vent} vent` : "Météo"}
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${couleur}`}
      title={titre}
    >
      {meteo.dangereux ? (
        <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
      ) : (
        <Icon className="w-3 h-3 flex-shrink-0" />
      )}
      {vent ? (
        <span className="flex items-center gap-0.5">
          <FiWind className="w-3 h-3 flex-shrink-0" />
          {vent}
        </span>
      ) : (
        weatherCodeLabel(meteo.forecast?.weathercode) || "Météo"
      )}
    </span>
  );
};

export default SortieWeatherBadge;
