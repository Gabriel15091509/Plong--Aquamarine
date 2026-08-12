import React from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiActivity,
  FiPackage,
  FiFileText,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useFormations } from "../../hooks/Formation/useFormations";
import { formatRelativeTime } from "../../utils/helpers";

const RecentActivity = () => {
  // Récupération des données récentes
  const { useGetAll: useGetAdherents } = useAdherents();
  const { useGetUpcoming } = useSorties();
  const { useGetPending } = usePaiements();
  const { useGetActive } = useFormations();

  const { data: adherentsData } = useGetAdherents({
    limit: 3,
    order: [["date_inscription", "DESC"]],
  });
  const { data: sortiesData } = useGetUpcoming();
  const { data: paiementsData } = useGetPending();
  const { data: formationsData } = useGetActive();

  // Construction des activités
  const activities = [];

  // Nouveaux adhérents
  if (adherentsData?.data) {
    adherentsData.data.slice(0, 3).forEach((adherent) => {
      activities.push({
        id: `adherent-${adherent.num_adherent}`,
        type: "adherent",
        icon: FiUser,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-100",
        title: "Nouvel adhérent inscrit",
        description: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
        time: formatRelativeTime(adherent.date_inscription),
      });
    });
  }

  // Sorties à venir
  if (sortiesData?.data) {
    sortiesData.data.slice(0, 2).forEach((sortie) => {
      activities.push({
        id: `sortie-${sortie.id_sortie}`,
        type: "sortie",
        icon: FiCalendar,
        iconColor: "text-green-600",
        bgColor: "bg-green-100",
        title: "Nouvelle sortie planifiée",
        description: `${sortie.type} - ${sortie.lieu}`,
        time: formatRelativeTime(sortie.date_heure),
      });
    });
  }

  // Paiements en attente
  if (paiementsData?.data) {
    paiementsData.data.slice(0, 2).forEach((paiement) => {
      activities.push({
        id: `paiement-${paiement.id_paiement}`,
        type: "paiement",
        icon: FiDollarSign,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-100",
        title: "Paiement en attente",
        description: `${paiement.type_paiement} - ${paiement.montant} €`,
        time: formatRelativeTime(paiement.date_paiement),
      });
    });
  }

  // Formations actives
  if (formationsData?.data) {
    formationsData.data.slice(0, 2).forEach((formation) => {
      activities.push({
        id: `formation-${formation.id_formation}`,
        type: "formation",
        icon: FiAward,
        iconColor: "text-orange-600",
        bgColor: "bg-orange-100",
        title: "Formation en cours",
        description: `Niveau ${formation.niveau_vise} - ${formation.nb_seances_realisees} séances`,
        time: formatRelativeTime(formation.date_debut),
      });
    });
  }

  // Trier par date (les plus récents en premier)
  activities.sort((a, b) => {
    // Ordre basé sur les indices de temps approximatifs
    return 0;
  });

  // Limiter à 5 activités
  const recentActivities = activities.slice(0, 5);

  // Si pas d'activités, afficher un message
  if (recentActivities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Activité récente
        </h3>
        <div className="text-center py-8 text-gray-500">
          <FiActivity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiActivity className="w-5 h-5 text-primary-500" />
        Activité récente
      </h3>
      <div className="space-y-3">
        {recentActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div
              className={`w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
            >
              <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {activity.time}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
