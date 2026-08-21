import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAnchor, FiMapPin, FiCalendar, FiArrowRight } from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAuth } from "../../context/AuthContext";
import { joursRestants } from "../../utils/helpers";

const formatDateLongue = (date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// Bandeau "Prochaine sortie", affiché sur le tableau de bord plutôt que
// noyé dans la liste des sorties, pour rester visible sans avoir à
// naviguer. La source diffère selon le rôle :
//   - staff (président/moniteur/trésorier) : la prochaine sortie du club,
//     toutes confondues (voir SortieService.getUpcomingSorties).
//   - adhérent : SA prochaine sortie, et seulement si son inscription est
//     "Confirmée" — une sortie où il est juste en attente/liste d'attente
//     n'est pas encore acquise, ça n'aurait pas de sens de lancer un compte
//     à rebours dessus.
const ProchaineSortieCard = () => {
  const { user } = useAuth();
  const isAdherent = user?.role === "adherent";

  const { useGetUpcoming } = useSorties();
  const { useGetAll: useGetAllInscriptions } = useInscriptions();

  // Scopée à l'adhérent connecté côté backend (InscriptionService.getAll) —
  // un seul appel, filtré/trié ci-dessous, plutôt qu'un endpoint dédié.
  const { data: upcomingData, isLoading: loadingUpcoming } = useGetUpcoming({
    enabled: !isAdherent,
  });
  const { data: inscriptionsData, isLoading: loadingInscriptions } =
    useGetAllInscriptions({ enabled: isAdherent });

  const isLoading = isAdherent ? loadingInscriptions : loadingUpcoming;

  const prochaine = useMemo(() => {
    if (isAdherent) {
      const inscriptions = inscriptionsData?.data || [];
      const now = new Date();
      const confirmees = inscriptions
        .filter(
          (i) =>
            i.statut === "Confirmée" &&
            i.sortie?.date_heure &&
            new Date(i.sortie.date_heure) >= now,
        )
        .sort((a, b) => new Date(a.sortie.date_heure) - new Date(b.sortie.date_heure));
      return confirmees[0]?.sortie || null;
    }
    const sorties = upcomingData?.data || [];
    return sorties.length > 0 ? sorties[0] : null;
  }, [isAdherent, inscriptionsData, upcomingData]);

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
            {isAdherent ? "Aucune sortie confirmée à venir" : "Aucune sortie à venir"}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {isAdherent
              ? "Vous n'êtes inscrit(e) et confirmé(e) à aucune sortie pour le moment."
              : "Aucune sortie planifiée pour le moment."}
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
        // Couleur pleine (pas de dégradé arc-en-ciel) : bleu marine profond,
        // cohérent avec l'identité "plongée" (voir l'en-tête des emails OTP,
        // même teinte) plutôt qu'un gradient générique — un simple accent
        // cyan sur l'icône suffit à faire le lien avec le reste de l'appli.
        className="group relative overflow-hidden rounded-3xl bg-slate-800 dark:bg-slate-900 border border-slate-700/60 shadow-lg hover:shadow-xl transition-shadow duration-300 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="relative flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
            <FiAnchor className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {isAdherent ? "Ma prochaine sortie confirmée" : "Prochaine sortie"}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              {prochaine.type} — {prochaine.site || prochaine.lieu}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-300 text-xs">
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

        {/* self-stretch retiré : sur mobile, ça étirait ce bloc sur toute la
            largeur alors que la pastille reste alignée à gauche (la flèche
            est masquée en dessous de sm) — beaucoup de vide à droite pour
            rien. En largeur naturelle, la pastille suit directement le bloc
            titre/date au lieu de flotter. */}
        <div className="relative flex items-center gap-3 flex-shrink-0">
          <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white/5 rounded-2xl border border-white/10 text-center">
            <p className="text-xl sm:text-2xl font-bold text-white leading-none">
              {compteARebours}
            </p>
            {compteARebourSuffixe && (
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">
                {compteARebourSuffixe}
              </p>
            )}
          </div>
          <FiArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all duration-300 hidden sm:block" />
        </div>
      </Link>
    </motion.div>
  );
};

export default ProchaineSortieCard;
