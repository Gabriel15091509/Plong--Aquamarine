import React from "react";
import { motion } from "framer-motion";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiActivity,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useFormations } from "../../hooks/Formation/useFormations";
import { formatRelativeTime } from "../../utils/helpers";

// Contenu seul (pas de carte/titre propres) : DashboardPage.jsx fournit déjà
// la carte "Activité récente" (icône, sous-titre, bouton "Voir tout") autour
// de ce composant — même découpage que RecentActivityAdherent.jsx/
// AdherentRecapCard.jsx pour la vue adhérent. Un ancien <div bg-white...>
// avec son propre titre ici dupliquait la carte et le titre de DashboardPage.
const RecentActivity = () => {
  const { useGetAll: useGetAdherents } = useAdherents();
  const { useGetUpcoming } = useSorties();
  const { useGetPending } = usePaiements();
  const { useGetActive } = useFormations();

  // Aucun de ces 4 appels n'accepte de tri/limite côté serveur (getAll côté
  // identite-service ignore silencieusement les query params, par ex. — voir
  // AdherentController.getAll) : on récupère tout et on trie/tronque
  // nous-mêmes ci-dessous, plutôt que de dépendre d'un `limit`/`order` qui
  // n'a jamais été appliqué et laissait remonter les enregistrements les
  // PLUS ANCIENS (ordre par défaut de la base) au lieu des plus récents.
  const { data: adherentsData } = useGetAdherents();
  const { data: sortiesData } = useGetUpcoming();
  const { data: paiementsData } = useGetPending();
  const { data: formationsData } = useGetActive();

  const activities = [];

  // Nouveaux adhérents — triés par date d'inscription avant de ne garder
  // que les 3 plus récents (voir commentaire ci-dessus).
  [...(adherentsData?.data || [])]
    .sort((a, b) => new Date(b.date_inscription) - new Date(a.date_inscription))
    .slice(0, 3)
    .forEach((adherent) => {
      activities.push({
        id: `adherent-${adherent.num_adherent}`,
        date: adherent.date_inscription,
        icon: FiUser,
        iconColor: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        title: "Nouvel adhérent inscrit",
        description: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
        to: `/adherents/${adherent.num_adherent}`,
      });
    });

  // Sorties à venir — déjà triées par date (la plus proche d'abord) côté
  // serveur (voir findUpcomingWithInscriptionCounts), ordre conservé tel
  // quel : contrairement aux 3 autres catégories, il n'existe pas de date de
  // création exploitable ici, la date de la sortie elle-même reste le
  // meilleur repère disponible.
  (sortiesData?.data || []).slice(0, 2).forEach((sortie) => {
    activities.push({
      id: `sortie-${sortie.id_sortie}`,
      date: sortie.date_heure,
      icon: FiCalendar,
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      title: "Nouvelle sortie planifiée",
      description: `${sortie.type} - ${sortie.lieu}`,
      to: `/sorties/${sortie.id_sortie}`,
    });
  });

  // Paiements en attente — date_paiement vaut la date de création de
  // l'enregistrement pour un paiement encore "En attente" (voir le
  // commentaire équivalent dans PaiementRepository.findEnRetard côté
  // backend), donc un vrai repère de récence ; triés ici pour la même
  // raison que les adhérents (findPendingPayments ne trie pas).
  [...(paiementsData?.data || [])]
    .sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement))
    .slice(0, 2)
    .forEach((paiement) => {
      activities.push({
        id: `paiement-${paiement.id_paiement}`,
        date: paiement.date_paiement,
        icon: FiDollarSign,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        title: "Paiement en attente",
        description: `${paiement.type_paiement} - ${paiement.montant} €`,
        to: `/paiements/${paiement.id_paiement}`,
      });
    });

  // Formations actives — déjà triées par date_debut DESC côté serveur
  // (FormationRepository.findActive), simple slice ici.
  (formationsData?.data || []).slice(0, 2).forEach((formation) => {
    activities.push({
      id: `formation-${formation.id_formation}`,
      date: formation.date_debut,
      icon: FiAward,
      iconColor: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      title: "Formation en cours",
      description: `Niveau ${formation.niveau_vise} - ${formation.nb_seances_realisees} séances`,
      to: `/formations/${formation.id_formation}`,
    });
  });

  // Fusion des 4 catégories, triée par date réelle décroissante — l'ancien
  // `.sort((a, b) => 0)` ici ne triait en fait jamais rien (comparateur
  // toujours nul), les activités restaient dans leur ordre d'insertion
  // (adhérents, puis sorties, puis paiements, puis formations) quelle que
  // soit leur date réelle.
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
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04, duration: 0.2 }}
        >
          <ModalLink
            to={activity.to}
            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
          >
            <div
              className={`w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
            >
              <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
            </div>
            {/* "time" replié sous la description (au lieu d'une colonne à
                part sur la même ligne que le titre) : sur mobile, ce texte
                partageait l'espace du titre dans un flex-1 devenu trop
                étroit — le titre se retrouvait forcé à passer sur 3 lignes
                très courtes ("Nouvel" / "adhérent" / "inscrit"), et "time"
                (centré verticalement sur toute la hauteur de la ligne)
                atterrissait visuellement au milieu de ce titre éclaté,
                donnant une impression de chevauchement des deux textes. */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {formatRelativeTime(activity.date)}
              </p>
            </div>
          </ModalLink>
        </motion.div>
      ))}
    </div>
  );
};

export default RecentActivity;
