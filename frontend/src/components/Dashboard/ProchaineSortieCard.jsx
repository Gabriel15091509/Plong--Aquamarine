import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAnchor, FiMapPin, FiCalendar, FiArrowRight } from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { joursRestants } from "../../utils/helpers";

const formatDateLongue = (date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// Bandeau "Prochaine sortie" : la sortie la plus proche dans le temps (déjà
// triée et scopée par niveau côté backend, voir SortieService.
// getUpcomingSorties/useGetUpcoming) avec un compte à rebours en jours —
// affiché sur le tableau de bord plutôt que noyé dans la liste des sorties,
// pour rester visible sans avoir à naviguer.
const ProchaineSortieCard = () => {
  const { useGetUpcoming } = useSorties();
  const { data, isLoading } = useGetUpcoming();

  const prochaine = useMemo(() => {
    const sorties = data?.data || [];
    return sorties.length > 0 ? sorties[0] : null;
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-slate-100 dark:bg-slate-800 p-6 h-[104px] sm:h-[92px] animate-pulse" />
    );
  }

  if (!prochaine) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          <FiAnchor className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Aucune sortie à venir
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Aucune sortie planifiée pour le moment.
          </p>
        </div>
      </div>
    );
  }

  const jours = joursRestants(prochaine.date_heure);
  const compteARebours =
    jours <= 0 ? "Aujourd'hui" : jours === 1 ? "Demain" : `${jours}`;
  const compteARebourSuffixe = jours > 1 ? "jours restants" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Link
        to={`/sorties/${prochaine.id_sortie}`}
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-800 dark:via-blue-800 dark:to-cyan-800 shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
            <FiAnchor className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Prochaine sortie
            </p>
            <h3 className="text-lg font-bold text-white truncate">
              {prochaine.type} — {prochaine.site || prochaine.lieu}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-white/80 text-xs">
              <span className="flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5" />
                {formatDateLongue(prochaine.date_heure)}
              </span>
              <span className="flex items-center gap-1.5">
                <FiMapPin className="w-3.5 h-3.5" />
                {prochaine.lieu}
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-3 flex-shrink-0 self-stretch sm:self-auto">
          <div className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
            <p className="text-2xl font-bold text-white leading-none">
              {compteARebours}
            </p>
            {compteARebourSuffixe && (
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/60 mt-1">
                {compteARebourSuffixe}
              </p>
            )}
          </div>
          <FiArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all duration-300 hidden sm:block" />
        </div>
      </Link>
    </motion.div>
  );
};

export default ProchaineSortieCard;
