import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiTrendingUp,
  FiActivity,
  FiPackage,
} from "react-icons/fi";
import { useAdherents } from "../hooks/useAdherents";
import { useSorties } from "../hooks/useSorties";
import { usePaiements } from "../hooks/usePaiements";
import { useFormations } from "../hooks/useFormations";
import { usePlongees } from "../hooks/usePlongees";
import { useMateriels } from "../hooks/useMateriels";
import StatsCard from "../components/Common/StatsCard";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import BarChart from "../components/Charts/BarChart";
import PieChart from "../components/Charts/PieChart";
import RecentActivity from "../components/Dashboard/RecentActivity";
import VideoBackground from "../components/Common/VideoBackground";
import Logo from "../components/Common/Logo";

// ✅ Fonction pour formater les nombres avec séparateur de milliers
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return num.toLocaleString("fr-FR");
};

// ✅ Fonction pour formater les montants en euros
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 €";
  return amount.toLocaleString("fr-FR") + " €";
};

const DashboardPage = () => {
  // ✅ Récupération des hooks
  const { useGetStats: useGetAdherentStats } = useAdherents();
  const { useGetStats: useGetSortieStats } = useSorties();
  const { useGetStats: useGetPaiementStats } = usePaiements();
  const { useGetStats: useGetFormationStats } = useFormations();
  const { useGetStats: useGetPlongeeStats } = usePlongees();
  const { useGetStats: useGetMaterielStats } = useMateriels();

  // ✅ Appel des hooks
  const {
    data: adherentStats,
    isLoading: adherentLoading,
    error: adherentError,
  } = useGetAdherentStats();
  const {
    data: sortieStats,
    isLoading: sortieLoading,
    error: sortieError,
  } = useGetSortieStats();
  const {
    data: paiementStats,
    isLoading: paiementLoading,
    error: paiementError,
  } = useGetPaiementStats();
  const {
    data: formationStats,
    isLoading: formationLoading,
    error: formationError,
  } = useGetFormationStats();
  const {
    data: plongeeStats,
    isLoading: plongeeLoading,
    error: plongeeError,
  } = useGetPlongeeStats();
  const {
    data: materielStats,
    isLoading: materielLoading,
    error: materielError,
  } = useGetMaterielStats();

  const isLoading =
    adherentLoading ||
    sortieLoading ||
    paiementLoading ||
    formationLoading ||
    plongeeLoading ||
    materielLoading;

  // ✅ Gestion des erreurs
  const hasError =
    adherentError ||
    sortieError ||
    paiementError ||
    formationError ||
    plongeeError ||
    materielError;

  if (hasError) {
    console.warn("⚠️ Erreur de chargement des données du dashboard:", {
      adherentError,
      sortieError,
      paiementError,
      formationError,
      plongeeError,
      materielError,
    });
  }

  // ✅ Calcul des statistiques
  const statsData = useMemo(() => {
    // ✅ Adhérents
    const totalAdherents = adherentStats?.data?.total || 0;
    const activeAdherents = adherentStats?.data?.active || 0;
    const inactiveAdherents = adherentStats?.data?.inactive || 0;
    const suspendedAdherents = adherentStats?.data?.suspended || 0;

    // ✅ Sorties
    const sortieData = sortieStats?.data || [];
    let totalSorties = 0;
    let plannedSorties = 0;
    let ongoingSorties = 0;
    let completedSorties = 0;
    let cancelledSorties = 0;

    if (Array.isArray(sortieData) && sortieData.length > 0) {
      if (sortieData[0]?.statut) {
        totalSorties = sortieData.reduce(
          (sum, s) => sum + (parseInt(s.count) || 0),
          0,
        );
        plannedSorties = sortieData
          .filter((s) => s.statut === "Planifiée")
          .reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
        ongoingSorties = sortieData
          .filter((s) => s.statut === "En cours")
          .reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
        completedSorties = sortieData
          .filter((s) => s.statut === "Terminée")
          .reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
        cancelledSorties = sortieData
          .filter((s) => s.statut === "Annulée")
          .reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
      } else {
        totalSorties = sortieData.length;
        plannedSorties = sortieData.filter(
          (s) => s.statut === "Planifiée",
        ).length;
        ongoingSorties = sortieData.filter(
          (s) => s.statut === "En cours",
        ).length;
        completedSorties = sortieData.filter(
          (s) => s.statut === "Terminée",
        ).length;
        cancelledSorties = sortieData.filter(
          (s) => s.statut === "Annulée",
        ).length;
      }
    } else if (sortieStats?.data && typeof sortieStats.data === "object") {
      totalSorties = sortieStats.data.total || sortieStats.data.count || 0;
      plannedSorties =
        sortieStats.data.planifiees || sortieStats.data.planned || 0;
      ongoingSorties =
        sortieStats.data.enCours || sortieStats.data.ongoing || 0;
      completedSorties =
        sortieStats.data.terminees || sortieStats.data.completed || 0;
      cancelledSorties =
        sortieStats.data.annulees || sortieStats.data.cancelled || 0;
    }

    // ✅ Paiements
    const paiementData = paiementStats?.data || [];
    let totalPaiements = 0;
    let pendingPaiements = 0;
    let validatedPaiements = 0;
    let totalPaiementsAmount = 0;

    if (Array.isArray(paiementData) && paiementData.length > 0) {
      if (paiementData[0]?.statut) {
        totalPaiements = paiementData.reduce(
          (sum, p) => sum + (parseInt(p.count) || 0),
          0,
        );
        pendingPaiements = paiementData
          .filter((p) => p.statut === "En attente")
          .reduce((sum, p) => sum + (parseInt(p.count) || 0), 0);
        validatedPaiements = paiementData
          .filter((p) => p.statut === "Validé")
          .reduce((sum, p) => sum + (parseInt(p.count) || 0), 0);
        totalPaiementsAmount = paiementData.reduce(
          (sum, p) => sum + parseFloat(p.total || 0),
          0,
        );
      } else {
        totalPaiements = paiementData.length;
        pendingPaiements = paiementData.filter(
          (p) => p.statut === "En attente",
        ).length;
        validatedPaiements = paiementData.filter(
          (p) => p.statut === "Validé",
        ).length;
        totalPaiementsAmount = paiementData.reduce(
          (sum, p) => sum + parseFloat(p.total || 0),
          0,
        );
      }
    } else if (paiementStats?.data && typeof paiementStats.data === "object") {
      totalPaiements =
        paiementStats.data.total || paiementStats.data.count || 0;
      pendingPaiements =
        paiementStats.data.enAttente || paiementStats.data.pending || 0;
      validatedPaiements =
        paiementStats.data.valides || paiementStats.data.validated || 0;
      totalPaiementsAmount =
        paiementStats.data.montantTotal || paiementStats.data.totalAmount || 0;
    }

    // ✅ Formations
    const formationData = formationStats?.data || [];
    let totalFormations = 0;
    let activeFormations = 0;
    let completedFormations = 0;
    let abandonedFormations = 0;
    let suspendedFormations = 0;

    if (Array.isArray(formationData) && formationData.length > 0) {
      if (formationData[0]?.statut) {
        totalFormations = formationData.reduce(
          (sum, f) => sum + (parseInt(f.count) || 0),
          0,
        );
        activeFormations = formationData
          .filter((f) => f.statut === "En cours")
          .reduce((sum, f) => sum + (parseInt(f.count) || 0), 0);
        completedFormations = formationData
          .filter((f) => f.statut === "Terminée")
          .reduce((sum, f) => sum + (parseInt(f.count) || 0), 0);
        abandonedFormations = formationData
          .filter((f) => f.statut === "Abandonnée")
          .reduce((sum, f) => sum + (parseInt(f.count) || 0), 0);
        suspendedFormations = formationData
          .filter((f) => f.statut === "Suspendue")
          .reduce((sum, f) => sum + (parseInt(f.count) || 0), 0);
      } else {
        totalFormations = formationData.length;
        activeFormations = formationData.filter(
          (f) => f.statut === "En cours",
        ).length;
        completedFormations = formationData.filter(
          (f) => f.statut === "Terminée",
        ).length;
        abandonedFormations = formationData.filter(
          (f) => f.statut === "Abandonnée",
        ).length;
        suspendedFormations = formationData.filter(
          (f) => f.statut === "Suspendue",
        ).length;
      }
    } else if (
      formationStats?.data &&
      typeof formationStats.data === "object"
    ) {
      totalFormations =
        formationStats.data.total || formationStats.data.count || 0;
      activeFormations =
        formationStats.data.enCours || formationStats.data.active || 0;
      completedFormations =
        formationStats.data.terminees || formationStats.data.completed || 0;
      abandonedFormations =
        formationStats.data.abandonnees || formationStats.data.abandoned || 0;
      suspendedFormations =
        formationStats.data.suspendues || formationStats.data.suspended || 0;
    }

    // ✅ Plongées
    const plongeeData = plongeeStats?.data || [];
    let totalPlongees = 0;
    let avgDepth = 0;

    if (Array.isArray(plongeeData) && plongeeData.length > 0) {
      if (plongeeData[0]?.type_plongee) {
        totalPlongees = plongeeData.reduce(
          (sum, s) => sum + (parseInt(s.count) || 0),
          0,
        );
        const totalDepth = plongeeData.reduce(
          (sum, s) => sum + (parseFloat(s.avg_depth) || 0),
          0,
        );
        avgDepth = totalDepth / plongeeData.length || 0;
      } else {
        totalPlongees = plongeeData.reduce(
          (sum, s) => sum + (parseInt(s.count) || 0),
          0,
        );
        const totalDepth = plongeeData.reduce(
          (sum, s) => sum + (parseFloat(s.avg_depth) || 0),
          0,
        );
        avgDepth = totalDepth / plongeeData.length || 0;
      }
    } else if (plongeeStats?.data && typeof plongeeStats.data === "object") {
      totalPlongees = plongeeStats.data.total || plongeeStats.data.count || 0;
      avgDepth =
        plongeeStats.data.profondeurMoyenne || plongeeStats.data.avgDepth || 0;
    }

    // ✅ Matériel
    const materielData = materielStats?.data || [];
    let totalMateriels = 0;
    let availableMateriels = 0;

    if (Array.isArray(materielData) && materielData.length > 0) {
      if (materielData[0]?.categorie) {
        totalMateriels = materielData.reduce(
          (sum, m) => sum + (parseInt(m.count) || 0),
          0,
        );
        availableMateriels = materielData
          .filter((m) => m.etat === "Bon" || m.etat === "Neuf")
          .reduce((sum, m) => sum + (parseInt(m.count) || 0), 0);
      } else {
        totalMateriels = materielData.reduce(
          (sum, m) => sum + (parseInt(m.count) || 0),
          0,
        );
        availableMateriels = materielData
          .filter((m) => m.etat === "Bon" || m.etat === "Neuf")
          .reduce((sum, m) => sum + (parseInt(m.count) || 0), 0);
      }
    } else if (materielStats?.data && typeof materielStats.data === "object") {
      totalMateriels =
        materielStats.data.total || materielStats.data.count || 0;
      availableMateriels =
        materielStats.data.disponible || materielStats.data.available || 0;
    }

    return {
      totalAdherents: Math.round(totalAdherents) || 0,
      activeAdherents: Math.round(activeAdherents) || 0,
      inactiveAdherents: Math.round(inactiveAdherents) || 0,
      suspendedAdherents: Math.round(suspendedAdherents) || 0,
      totalSorties: Math.round(totalSorties) || 0,
      plannedSorties: Math.round(plannedSorties) || 0,
      ongoingSorties: Math.round(ongoingSorties) || 0,
      completedSorties: Math.round(completedSorties) || 0,
      cancelledSorties: Math.round(cancelledSorties) || 0,
      totalPaiements: Math.round(totalPaiements) || 0,
      pendingPaiements: Math.round(pendingPaiements) || 0,
      validatedPaiements: Math.round(validatedPaiements) || 0,
      totalPaiementsAmount: Math.round(totalPaiementsAmount) || 0,
      totalFormations: Math.round(totalFormations) || 0,
      activeFormations: Math.round(activeFormations) || 0,
      completedFormations: Math.round(completedFormations) || 0,
      abandonedFormations: Math.round(abandonedFormations) || 0,
      suspendedFormations: Math.round(suspendedFormations) || 0,
      totalPlongees: Math.round(totalPlongees) || 0,
      avgDepth: Math.round(avgDepth) || 0,
      totalMateriels: Math.round(totalMateriels) || 0,
      availableMateriels: Math.round(availableMateriels) || 0,
    };
  }, [
    adherentStats,
    sortieStats,
    paiementStats,
    formationStats,
    plongeeStats,
    materielStats,
  ]);

  // ✅ Statistiques principales avec formatage
  const mainStats = useMemo(
    () => [
      {
        title: "Adhérents",
        value: formatNumber(statsData.totalAdherents),
        icon: FiUsers,
        color: "from-blue-500 to-blue-600",
        subValue: `${formatNumber(statsData.activeAdherents)} actifs • ${formatNumber(statsData.inactiveAdherents)} inactifs • ${formatNumber(statsData.suspendedAdherents)} suspendus`,
      },
      {
        title: "Sorties",
        value: formatNumber(statsData.totalSorties),
        icon: FiCalendar,
        color: "from-green-500 to-green-600",
        subValue: `${formatNumber(statsData.plannedSorties)} planifiées • ${formatNumber(statsData.ongoingSorties)} en cours • ${formatNumber(statsData.completedSorties)} terminées`,
      },
      {
        title: "Paiements",
        value: formatCurrency(statsData.totalPaiementsAmount),
        icon: FiDollarSign,
        color: "from-purple-500 to-purple-600",
        subValue: `${formatNumber(statsData.validatedPaiements)} validés • ${formatNumber(statsData.pendingPaiements)} en attente`,
      },
      {
        title: "Formations",
        value: formatNumber(statsData.totalFormations),
        icon: FiAward,
        color: "from-orange-500 to-orange-600",
        subValue: `${formatNumber(statsData.activeFormations)} en cours • ${formatNumber(statsData.completedFormations)} terminées`,
      },
    ],
    [statsData],
  );

  // ✅ Statistiques secondaires
  const secondaryStats = useMemo(
    () => [
      {
        title: "Plongées totales",
        value: formatNumber(statsData.totalPlongees),
        icon: FiActivity,
        color: "from-teal-500 to-teal-600",
        subValue:
          statsData.avgDepth > 0
            ? `Profondeur moyenne: ${formatNumber(statsData.avgDepth)}m`
            : "Aucune plongée enregistrée",
      },
      {
        title: "Matériel disponible",
        value: `${formatNumber(statsData.availableMateriels)}/${formatNumber(statsData.totalMateriels)}`,
        icon: FiPackage,
        color: "from-cyan-500 to-cyan-600",
        subValue:
          statsData.totalMateriels > 0
            ? `${Math.round((statsData.availableMateriels / statsData.totalMateriels) * 100)}% du stock`
            : "Aucun matériel enregistré",
      },
    ],
    [statsData],
  );

  // ✅ Données pour le graphique
  const monthlyActivityData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    return months.map((month, index) => ({
      month,
      adherents:
        Math.max(
          1,
          Math.round(statsData.activeAdherents * (0.5 + index * 0.1)),
        ) || 5,
      sorties:
        Math.max(
          0,
          Math.round(statsData.plannedSorties * (0.3 + index * 0.1)),
        ) || 2,
      paiements:
        Math.max(
          0,
          Math.round(statsData.validatedPaiements * (0.3 + index * 0.1)),
        ) || 3,
    }));
  }, [statsData]);

  // ✅ Données pour le graphique des statuts
  const statusData = useMemo(
    () => [
      { name: "Actifs", value: Math.max(1, statsData.activeAdherents) },
      { name: "Inactifs", value: Math.max(0, statsData.inactiveAdherents) },
      { name: "Suspendus", value: Math.max(0, statsData.suspendedAdherents) },
    ],
    [statsData],
  );

  // ✅ Affichage du chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Bannière d'erreur */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Certaines données ne sont pas disponibles
              </p>
              <p className="text-xs text-yellow-600">
                Les statistiques affichées peuvent être partielles
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
          >
            Réessayer
          </button>
        </motion.div>
      )}

      {/* En-tête avec vidéo */}
      <VideoBackground className="rounded-2xl h-[150px] md:h-[180px] shadow-xl">
        <div className="h-full flex flex-col justify-center px-6 md:px-12 text-white pt-2 md:pt-3 pb-2 md:pb-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-6"
          >
            {/* Logo */}
            <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl border border-white/40 shadow-2xl flex-shrink-0">
              <Logo size="xl" className="flex-shrink-0" />
            </div>

            <div className="hidden sm:block w-px h-12 bg-white/40" />

            <div>
              <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide drop-shadow-2xl flex items-center gap-3">
                Tableau de bord
                <span className="text-xs font-semibold text-white/90 bg-white/25 px-3 py-1 rounded-full shadow-lg">
                  Dashboard
                </span>
              </h1>
              <p className="text-white/90 text-sm md:text-base font-medium tracking-wider mt-1 flex items-center gap-2 drop-shadow-lg">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Gérez votre club de plongée en toute simplicité
              </p>
            </div>

            <div className="hidden lg:block ml-auto text-right">
              <p className="text-white/70 text-xs font-medium tracking-widest drop-shadow-lg">
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </motion.div>

          {/* Statistiques rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 pt-3 border-t border-white/30"
          >
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <span className="text-white/90 text-xs font-medium tracking-wider">
                {formatNumber(statsData.totalAdherents)} adhérents
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-white/90 text-xs font-medium tracking-wider">
                {formatNumber(statsData.plannedSorties)} sorties
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              <span className="text-white/90 text-xs font-medium tracking-wider">
                {formatCurrency(statsData.totalPaiementsAmount)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <span className="text-white/90 text-xs font-medium tracking-wider">
                {formatNumber(statsData.totalPlongees)} plongées
              </span>
            </div>
          </motion.div>
        </div>
      </VideoBackground>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secondaryStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 4) * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-primary-500" />
            Activité mensuelle
          </h3>
          <BarChart data={monthlyActivityData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-primary-500" />
            Statut des adhérents
          </h3>
          <PieChart data={statusData} />
        </motion.div>
      </div>

      {/* Activité récente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <RecentActivity />
      </motion.div>
    </div>
  );
};

export default DashboardPage;
