import React from "react";
import { motion } from "framer-motion";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import InfoTooltip from "./InfoTooltip";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-blue-50 dark:bg-blue-900/20",
  textColor = "text-blue-600 dark:text-blue-400",
  subValue,
  trend,
  trendUp,
  // Texte affiché au survol/focus du badge de tendance ou de la valeur
  // (quand celle-ci est elle-même un pourcentage, ex: "Remplissage
  // sorties") — explique ce que représente vraiment le chiffre plutôt que
  // de laisser deviner (mois en cours vs même période le mois dernier,
  // taux actuel pondéré, etc.). Optionnel : sans hint, comportement
  // inchangé.
  trendHint,
  valueHint,
  badge,
  badgeColor = "text-gray-500 dark:text-slate-400",
  // Chargement propre à CETTE carte (sa requête à elle, pas un état combiné
  // de tout le dashboard) — voir DashboardPage.jsx : chaque carte affiche sa
  // donnée dès qu'elle est prête au lieu d'attendre que les 6 requêtes de
  // stats aient toutes fini. Titre/icône restent affichés tout de suite
  // (connus sans attendre aucune requête), seule la valeur est en squelette.
  loading = false,
}) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 p-5"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
        >
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">
          {title}
        </p>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2 animate-pulse" aria-hidden="true">
          <div className="h-7 w-20 rounded-md bg-gray-100 dark:bg-slate-700" />
          <div className="h-3 w-32 rounded-md bg-gray-100 dark:bg-slate-700" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4 truncate">
            {valueHint ? (
              <InfoTooltip label={valueHint}>
                <span className="underline decoration-dotted decoration-gray-300 dark:decoration-gray-600 underline-offset-4">
                  {value}
                </span>
              </InfoTooltip>
            ) : (
              value
            )}
          </p>

          {trend ? (
            <InfoTooltip label={trendHint} className="mt-2">
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  trendUp
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {trendUp ? (
                  <FiArrowUp className="w-3 h-3" />
                ) : (
                  <FiArrowDown className="w-3 h-3" />
                )}
                {trend}
              </span>
            </InfoTooltip>
          ) : badge ? (
            <span className={`inline-block text-xs font-semibold mt-2 ${badgeColor}`}>
              {badge}
            </span>
          ) : null}

          {subValue && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">
              {subValue}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
};

export default StatsCard;
