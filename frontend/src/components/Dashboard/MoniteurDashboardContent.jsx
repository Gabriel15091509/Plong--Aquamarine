import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiActivity, FiAward, FiClock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useFormations } from "../../hooks/Formation/useFormations";
import StatsCard from "../Common/StatsCard";
import ProchaineSortieCard from "./ProchaineSortieCard";
import RecentActivity from "./RecentActivity";

const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return num.toLocaleString("fr-FR");
};

const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

// Tableau de bord dédié au moniteur — distinct de StaffDashboardContent
// (DashboardPage.jsx, encore utilisé par président/trésorier) : un moniteur
// n'a pas à voir le chiffre d'affaires, les adhésions ou l'état du parc
// matériel du club, réservés à la gestion. Ce qui le concerne réellement,
// ce sont SES sorties/plongées/formations encadrées — mêmes règles de
// rattachement que les onglets "Sorties que j'encadre"/"Mes plongées"/
// "Formations que j'encadre" (voir SortiesPage.jsx/PlongeeList.jsx/
// FormationList.jsx), recalculées ici côté client faute d'endpoint
// "les miennes" côté back (même limite que ces 3 pages).
const MoniteurDashboardContent = () => {
  const { user } = useAuth();
  const { useGetByUserId } = useMoniteurs();
  const { data: moniteurData, isLoading: moniteurLoading } = useGetByUserId(
    user?.id,
  );
  const currentMoniteurId = moniteurData?.data?.id_moniteur;

  const { useGetAll: useGetAllSorties } = useSorties();
  const { useGetAll: useGetAllPlongees } = usePlongees();
  const { useGetAll: useGetAllFormations } = useFormations();

  const { data: sortiesData, isLoading: sortiesLoading } = useGetAllSorties();
  const { data: plongeesData, isLoading: plongeesLoading } = useGetAllPlongees();
  const { data: formationsData, isLoading: formationsLoading } =
    useGetAllFormations();

  const stats = useMemo(() => {
    const allSorties = sortiesData?.data || [];
    const allPlongees = plongeesData?.data || [];
    const allFormations = formationsData?.data || [];

    // Sortie.encadrants est un tableau d'id_moniteur — pas de champ
    // moniteur_id direct sur la sortie elle-même (voir SortieService.validate).
    const mesSorties = currentMoniteurId
      ? allSorties.filter(
          (s) =>
            Array.isArray(s.encadrants) && s.encadrants.includes(currentMoniteurId),
        )
      : [];
    const now = new Date();
    const sortiesAvenir = mesSorties.filter(
      (s) => new Date(s.date_heure) > now,
    ).length;

    // Map id_sortie -> encadrants, pour rattacher une plongée à une sortie
    // que je encadre même si je ne l'ai pas moi-même validée — même règle
    // que PlongeeList.jsx (mesPlongeesOnly).
    const sortieEncadrantsMap = new Map();
    allSorties.forEach((s) => {
      sortieEncadrantsMap.set(
        s.id_sortie || s.id,
        Array.isArray(s.encadrants) ? s.encadrants : [],
      );
    });
    const mesPlongees = currentMoniteurId
      ? allPlongees.filter((p) => {
          const jeSuisValidateur = p.id_moniteur_validateur === currentMoniteurId;
          const jEncadreLaSortie = (
            sortieEncadrantsMap.get(p.id_sortie) || []
          ).includes(currentMoniteurId);
          return jeSuisValidateur || jEncadreLaSortie;
        })
      : [];
    const plongeesAValider = mesPlongees.filter(
      (p) => !p.id_moniteur_validateur,
    ).length;

    // id_moniteur (identite-service), pas num_adherent : un moniteur n'est
    // pas forcément inscrit comme "adhérent" à sa propre formation.
    const mesFormations = currentMoniteurId
      ? allFormations.filter((f) => f.id_moniteur === currentMoniteurId)
      : [];
    const formationsEnCours = mesFormations.filter(
      (f) => f.statut === "En cours",
    ).length;

    return {
      totalSorties: mesSorties.length,
      sortiesAvenir,
      totalPlongees: mesPlongees.length,
      plongeesAValider,
      totalFormations: mesFormations.length,
      formationsEnCours,
    };
  }, [sortiesData, plongeesData, formationsData, currentMoniteurId]);

  // Chaque carte attend sa propre requête ET la résolution de
  // currentMoniteurId (moniteurLoading) : sans ça, un compte à 0 s'affiche
  // brièvement avant de sauter à la vraie valeur dès que le moniteur
  // connecté est résolu — même principe que StaffDashboardContent (chaque
  // StatsCard a son propre `loading`, pas un gate global).
  const cards = [
    {
      title: "Sorties que j'encadre",
      value: formatNumber(stats.totalSorties),
      icon: FiCalendar,
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-600 dark:text-emerald-400",
      subValue: `${formatNumber(stats.sortiesAvenir)} à venir`,
      loading: sortiesLoading || moniteurLoading,
    },
    {
      title: "Plongées liées à moi",
      value: formatNumber(stats.totalPlongees),
      icon: FiActivity,
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      textColor: "text-rose-600 dark:text-rose-400",
      subValue: `${formatNumber(stats.plongeesAValider)} à valider`,
      loading: plongeesLoading || moniteurLoading,
    },
    {
      title: "Formations que j'encadre",
      value: formatNumber(stats.totalFormations),
      icon: FiAward,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
      subValue: `${formatNumber(stats.formationsEnCours)} en cours`,
      loading: formationsLoading || moniteurLoading,
    },
  ];

  return (
    <div className="min-h-screen from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
      <ProchaineSortieCard />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {cards.map((stat) => (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 hover:shadow-2xl transition-shadow duration-300"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
            <FiClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Activité récente
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Dernières actions et événements
            </p>
          </div>
        </div>
        <RecentActivity />
      </motion.div>
    </div>
  );
};

export default MoniteurDashboardContent;
