import React from "react";
import { motion } from "framer-motion";
import { FiActivity, FiAnchor, FiDollarSign, FiCalendar } from "react-icons/fi";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { formatRelativeTime } from "../../utils/helpers";

// Équivalent personnel de RecentActivity.jsx : ne montre que les plongées,
// paiements et inscriptions de l'adhérent connecté, jamais l'activité du
// reste du club.
const RecentActivityAdherent = ({ numAdherent }) => {
  const { useGetByAdherent: useGetPlongeesByAdherent } = usePlongees();
  const { useGetByAdherent: useGetPaiementsByAdherent } = usePaiements();
  const { useGetByAdherent: useGetInscriptionsByAdherent } = useInscriptions();

  const { data: plongeesResponse } = useGetPlongeesByAdherent(numAdherent);
  const { data: paiementsResponse } = useGetPaiementsByAdherent(numAdherent);
  const { data: inscriptionsResponse } = useGetInscriptionsByAdherent(numAdherent);

  const activities = [];

  (plongeesResponse?.data || []).slice(0, 3).forEach((plongee) => {
    activities.push({
      id: `plongee-${plongee.id_plongee}`,
      date: plongee.date,
      icon: FiAnchor,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-100",
      title: "Plongée enregistrée",
      description: `${plongee.type_plongee} — ${plongee.profondeur_max} m`,
    });
  });

  (paiementsResponse?.data || []).slice(0, 3).forEach((paiement) => {
    activities.push({
      id: `paiement-${paiement.id_paiement}`,
      date: paiement.date_paiement,
      icon: FiDollarSign,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      title: "Paiement",
      description: `${paiement.type_paiement} — ${paiement.montant} € (${paiement.statut})`,
    });
  });

  (inscriptionsResponse?.data || []).slice(0, 3).forEach((inscription) => {
    activities.push({
      id: `inscription-${inscription.id_inscription}`,
      date: inscription.created_at,
      icon: FiCalendar,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      title: "Inscription à une sortie",
      description: inscription.sortie
        ? `${inscription.sortie.type} — ${inscription.sortie.lieu}`
        : `Sortie #${inscription.id_sortie}`,
    });
  });

  const recentActivities = activities
    .filter((a) => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recentActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        <FiActivity className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
        <p>Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div
            className={`w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}
          >
            <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {activity.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {activity.description}
            </p>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
            {formatRelativeTime(activity.date)}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default RecentActivityAdherent;
