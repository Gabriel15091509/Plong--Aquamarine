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
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiChevronRight,
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
import Logo from "../components/Common/Logo";

// ✅ Formattage des nombres
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return num.toLocaleString("fr-FR");
};

// ✅ Formattage des montants
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 €";
  return amount.toLocaleString("fr-FR") + " €";
};

// ✅ Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const DashboardPage = () => {
  // ✅ Hooks
  const { useGetStats: useGetAdherentStats } = useAdherents();
  const { useGetStats: useGetSortieStats } = useSorties();
  const { useGetStats: useGetPaiementStats } = usePaiements();
  const { useGetStats: useGetFormationStats } = useFormations();
  const { useGetStats: useGetPlongeeStats } = usePlongees();
  const { useGetStats: useGetMaterielStats } = useMateriels();

  // ✅ Données
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
    // Adhérents
    const totalAdherents = adherentStats?.data?.total || 0;
    const activeAdherents = adherentStats?.data?.active || 0;
    const inactiveAdherents = adherentStats?.data?.inactive || 0;
    const suspendedAdherents = adherentStats?.data?.suspended || 0;

    // Sorties
    const sortieData = sortieStats?.data || [];
    let totalSorties = 0,
      plannedSorties = 0,
      ongoingSorties = 0,
      completedSorties = 0,
      cancelledSorties = 0;

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

    // Paiements
    const paiementData = paiementStats?.data || [];
    let totalPaiements = 0,
      pendingPaiements = 0,
      validatedPaiements = 0,
      totalPaiementsAmount = 0;

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

    // Formations
    const formationData = formationStats?.data || [];
    let totalFormations = 0,
      activeFormations = 0,
      completedFormations = 0,
      abandonedFormations = 0,
      suspendedFormations = 0;

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

    // Plongées
    const plongeeData = plongeeStats?.data || [];
    let totalPlongees = 0,
      avgDepth = 0;

    if (Array.isArray(plongeeData) && plongeeData.length > 0) {
      totalPlongees = plongeeData.reduce(
        (sum, s) => sum + (parseInt(s.count) || 0),
        0,
      );
      const totalDepth = plongeeData.reduce(
        (sum, s) => sum + (parseFloat(s.avg_depth) || 0),
        0,
      );
      avgDepth = totalDepth / plongeeData.length || 0;
    } else if (plongeeStats?.data && typeof plongeeStats.data === "object") {
      totalPlongees = plongeeStats.data.total || plongeeStats.data.count || 0;
      avgDepth =
        plongeeStats.data.profondeurMoyenne || plongeeStats.data.avgDepth || 0;
    }

    // Matériel
    const materielData = materielStats?.data || [];
    let totalMateriels = 0,
      availableMateriels = 0;

    if (Array.isArray(materielData) && materielData.length > 0) {
      totalMateriels = materielData.reduce(
        (sum, m) => sum + (parseInt(m.count) || 0),
        0,
      );
      availableMateriels = materielData
        .filter((m) => m.etat === "Bon" || m.etat === "Neuf")
        .reduce((sum, m) => sum + (parseInt(m.count) || 0), 0);
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

  // ✅ Statistiques principales
  const mainStats = useMemo(
    () => [
      {
        title: "Adhérents",
        value: formatNumber(statsData.totalAdherents),
        icon: FiUsers,
        color: "from-blue-500 to-indigo-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-600 dark:text-blue-400",
        subValue: `${formatNumber(statsData.activeAdherents)} actifs • ${formatNumber(statsData.inactiveAdherents)} inactifs • ${formatNumber(statsData.suspendedAdherents)} suspendus`,
        trend: "+12%",
        trendUp: true,
      },
      {
        title: "Sorties",
        value: formatNumber(statsData.totalSorties),
        icon: FiCalendar,
        color: "from-emerald-500 to-green-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        textColor: "text-emerald-600 dark:text-emerald-400",
        subValue: `${formatNumber(statsData.plannedSorties)} planifiées • ${formatNumber(statsData.ongoingSorties)} en cours • ${formatNumber(statsData.completedSorties)} terminées`,
        trend: "+8%",
        trendUp: true,
      },
      {
        title: "Chiffre d'affaires",
        value: formatCurrency(statsData.totalPaiementsAmount),
        icon: FiDollarSign,
        color: "from-purple-500 to-violet-600",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-600 dark:text-purple-400",
        subValue: `${formatNumber(statsData.validatedPaiements)} validés • ${formatNumber(statsData.pendingPaiements)} en attente`,
        trend: "+15%",
        trendUp: true,
      },
      {
        title: "Formations",
        value: formatNumber(statsData.totalFormations),
        icon: FiAward,
        color: "from-orange-500 to-amber-600",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        textColor: "text-orange-600 dark:text-orange-400",
        subValue: `${formatNumber(statsData.activeFormations)} en cours • ${formatNumber(statsData.completedFormations)} terminées`,
        trend: "+5%",
        trendUp: true,
      },
    ],
    [statsData],
  );

  // ✅ Statistiques secondaires
  const secondaryStats = useMemo(
    () => [
      {
        title: "Plongées",
        value: formatNumber(statsData.totalPlongees),
        icon: FiActivity,
        color: "from-rose-500 to-pink-600",
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        textColor: "text-rose-600 dark:text-rose-400",
        subValue:
          statsData.avgDepth > 0
            ? `Profondeur moyenne: ${formatNumber(statsData.avgDepth)}m`
            : "Aucune plongée",
        trend: "+23%",
        trendUp: true,
      },
      {
        title: "Matériel disponible",
        value: `${formatNumber(statsData.availableMateriels)}/${formatNumber(statsData.totalMateriels)}`,
        icon: FiPackage,
        color: "from-cyan-500 to-sky-600",
        bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
        textColor: "text-cyan-600 dark:text-cyan-400",
        subValue:
          statsData.totalMateriels > 0
            ? `${Math.round((statsData.availableMateriels / statsData.totalMateriels) * 100)}% du stock`
            : "Aucun matériel",
        trend: "-3%",
        trendUp: false,
      },
    ],
    [statsData],
  );

  // ✅ Données graphiques
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

  const statusData = useMemo(
    () => [
      { name: "Actifs", value: Math.max(1, statsData.activeAdherents) },
      { name: "Inactifs", value: Math.max(0, statsData.inactiveAdherents) },
      { name: "Suspendus", value: Math.max(0, statsData.suspendedAdherents) },
    ],
    [statsData],
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
      {/* Bannière d'erreur */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-600 dark:text-amber-400 text-xl">
              ⚠️
            </span>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Certaines données ne sont pas disponibles
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Les statistiques affichées peuvent être partielles
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-700/30 rounded-xl transition-colors"
          >
            Réessayer
          </button>
        </motion.div>
      )}

      {/* En-tête avec image de fond */}
      <div className="relative rounded-3xl h-[200px] md:h-[240px] shadow-2xl overflow-hidden">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&fit=crop')`,
            backgroundPosition: 'center 60%',
          }}
        />
        
        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-10" />

        {/* Motif de fond subtil */}
        <div className="absolute inset-0 opacity-[0.06] z-0 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Reflets lumineux */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl z-10 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl z-10 pointer-events-none" />

        <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-10 lg:px-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-4 md:gap-6"
          >
            {/* Logo */}
            <div className="hidden sm:flex items-center justify-center w-14 h-14 md:w-[72px] md:h-[72px] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex-shrink-0 hover:scale-105 hover:bg-white/20 transition-all duration-300">
              <Logo size="lg" className="flex-shrink-0" />
            </div>

            {/* Séparateur */}
            <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-white/30 via-white/10 to-transparent" />

            {/* Titre */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-2xl">
                  Tableau de bord
                </h1>
                <span className="text-[10px] md:text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-md px-3 md:px-4 py-1 rounded-full shadow-lg border border-white/20 hover:bg-white/30 transition-all duration-300">
                  Dashboard
                </span>
              </div>
              <p className="text-white/80 text-xs md:text-sm lg:text-base font-light tracking-wide mt-0.5 md:mt-1 flex items-center gap-2 drop-shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Gérez votre club de plongée en toute simplicité
              </p>
            </div>

            {/* Date et statut */}
            <div className="hidden lg:block text-right flex-shrink-0">
              <p className="text-white/50 text-[10px] font-medium tracking-[0.15em] drop-shadow-lg uppercase">
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="flex items-center justify-end gap-2 mt-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-white/30 text-[8px] font-light tracking-[0.25em] uppercase">
                  En direct
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10"
          >
            <div className="flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 cursor-default">
              <FiUsers className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-300" />
              <span className="text-white/90 text-[10px] md:text-xs font-medium tracking-wider whitespace-nowrap">
                {formatNumber(statsData.totalAdherents)} adhérents
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 cursor-default">
              <FiCalendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-300" />
              <span className="text-white/90 text-[10px] md:text-xs font-medium tracking-wider whitespace-nowrap">
                {formatNumber(statsData.plannedSorties)} sorties
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 cursor-default">
              <FiDollarSign className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-300" />
              <span className="text-white/90 text-[10px] md:text-xs font-medium tracking-wider whitespace-nowrap">
                {formatCurrency(statsData.totalPaiementsAmount)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 cursor-default">
              <FiActivity className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-300" />
              <span className="text-white/90 text-[10px] md:text-xs font-medium tracking-wider whitespace-nowrap">
                {formatNumber(statsData.totalPlongees)} plongées
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Statistiques principales */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {mainStats.map((stat) => (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Statistiques secondaires */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {secondaryStats.map((stat) => (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <FiBarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Activité mensuelle
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Évolution des indicateurs clés
                </p>
              </div>
            </div>
            <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
              Voir plus <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
          <BarChart data={monthlyActivityData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
              <FiPieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Statut des adhérents
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Répartition par statut
              </p>
            </div>
          </div>
          <PieChart data={statusData} />
        </motion.div>
      </div>

      {/* Activité récente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 hover:shadow-2xl transition-shadow duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
          <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
            Voir tout <FiChevronRight className="w-3 h-3" />
          </button>
        </div>
        <RecentActivity />
      </motion.div>
    </div>
  );
};

export default DashboardPage;