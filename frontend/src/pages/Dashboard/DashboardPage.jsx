import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
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
  FiPercent,
  FiRefreshCw,
  FiTool,
  FiUserX,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useFormations } from "../../hooks/Formation/useFormations";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useDashboard } from "../../hooks/Dashboard/useDashboard";
import StatsCard from "../../components/Common/StatsCard";
import BarChart from "../../components/Charts/BarChart";
import PieChart from "../../components/Charts/PieChart";
import RecentActivity from "../../components/Dashboard/RecentActivity";
import AdherentRecapCard from "../../components/Dashboard/AdherentRecapCard";
import MoniteurDashboardContent from "../../components/Dashboard/MoniteurDashboardContent";
import DashboardHero from "../../components/Dashboard/DashboardHero";
import ProchaineSortieCard from "../../components/Dashboard/ProchaineSortieCard";
import { useAuth } from "../../context/AuthContext";

// Formattage des nombres
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return num.toLocaleString("fr-FR");
};

// Formattage des montants
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 €";
  return amount.toLocaleString("fr-FR") + " €";
};

// Étiquette affichée au survol/focus des badges de tendance (↑/↓ %) —
// même formule dans les 6 microservices concernés (voir ex.
// AdherentService.getTrend) : fenêtre "depuis le 1er du mois" comparée à la
// même fenêtre, en nombre de jours, le mois précédent — jamais un mois
// complet contre un mois complet, d'où des pourcentages volatils en tout
// début de mois (petit échantillon des deux côtés).
const TREND_HINT =
  "Évolution depuis le 1er du mois, comparée au même nombre de jours le mois dernier — pas un mois complet contre un mois complet.";

// Étiquettes des deux cartes "tertiaires" dont la valeur affichée EST déjà
// un pourcentage (pas un badge de tendance) : une photo de l'état actuel,
// pas une évolution dans le temps — voir SortieService.getTauxRemplissage
// et AdhesionService.getTauxRenouvellement.
const REMPLISSAGE_HINT =
  "Places occupées (inscriptions confirmées) ÷ places offertes, sur les sorties non annulées — photo actuelle, pas une tendance.";
const RENOUVELLEMENT_HINT =
  "Part des adhérents \"Club\" de l'année dernière encore adhérents \"Club\" cette année — photo actuelle, pas une tendance.";

// Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Redirection depuis ProtectedRoute (accès à une page réservée au
  // réseau local du club, ex. Paiements/Matériel, via l'URL publique
  // Tailscale) — voir components/Common/ProtectedRoute.jsx.
  useEffect(() => {
    if (location.state?.notice) {
      toast(location.state.notice);
    }
  }, [location.state]);

  // Un adhérent voit sa fiche récapitulative personnelle (niveau, échéances)
  // plutôt que les statistiques globales du club, réservées au staff.
  if (user?.role === "adherent") {
    return (
      <div className="min-h-screen p-6">
        <AdherentRecapCard />
      </div>
    );
  }

  // Un moniteur voit SES sorties/plongées/formations encadrées plutôt que
  // le chiffre d'affaires, les adhésions ou l'état du parc matériel du
  // club — indicateurs de gestion réservés au président/trésorier (voir
  // MoniteurDashboardContent.jsx).
  if (user?.role === "moniteur") {
    return <MoniteurDashboardContent />;
  }

  return <StaffDashboardContent />;
};

// Désormais réservé au président/trésorier (voir le branchement moniteur
// ci-dessus) : le nom "Staff" date d'avant cette distinction, quand les 3
// rôles partageaient encore cette même vue — pas renommé pour limiter le
// diff, la portée réelle est documentée ici.
const StaffDashboardContent = () => {
  const { user } = useAuth();
  // Le trésorier n'a droit de regard sur les sorties nulle part ailleurs
  // dans l'appli (absent de canSeeSorties dans Sidebar.jsx, exclu du
  // requiredRoles de la route /sorties dans App.jsx) — la carte doit
  // suivre la même règle, sinon elle offre un lien direct vers le détail
  // d'une sortie (/sorties/:id) qu'aucun autre chemin ne lui montre.
  // Ne reste pertinent que pour "president" (moniteur a désormais sa
  // propre branche ci-dessus, jamais rendue avec ce composant).
  const canSeeSorties = ["president", "moniteur"].includes(user?.role);

  // Hooks
  const { useGetStats: useGetAdherentStats } = useAdherents();
  const { useGetStats: useGetSortieStats } = useSorties();
  const { useGetStats: useGetPaiementStats } = usePaiements();
  const { useGetStats: useGetFormationStats } = useFormations();
  const { useGetStats: useGetPlongeeStats } = usePlongees();
  const { useGetStats: useGetMaterielStats } = useMateriels();
  const { useGetTrends, useGetIndicateurs } = useDashboard();

  // Données
  const { data: trendsResponse } = useGetTrends();
  const trends = trendsResponse?.data;
  const { data: indicateursResponse, isLoading: indicateursLoading } =
    useGetIndicateurs();
  const indicateurs = indicateursResponse?.data;
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

  const hasError =
    adherentError ||
    sortieError ||
    paiementError ||
    formationError ||
    plongeeError ||
    materielError;

  if (hasError) {
    console.warn("Erreur de chargement des données du dashboard :", {
      adherentError,
      sortieError,
      paiementError,
      formationError,
      plongeeError,
      materielError,
    });
  }

  // Calcul des statistiques
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
          .filter((p) => p.statut === "Payé")
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
          (p) => p.statut === "Payé",
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

  // Statistiques principales
  const mainStats = useMemo(
    () => [
      {
        title: "Adhérents",
        value: formatNumber(statsData.totalAdherents),
        icon: FiUsers,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-600 dark:text-blue-400",
        subValue: `${formatNumber(statsData.activeAdherents)} actifs • ${formatNumber(statsData.inactiveAdherents)} inactifs • ${formatNumber(statsData.suspendedAdherents)} suspendus`,
        trend: trends?.adherents?.trend,
        trendUp: trends?.adherents?.trendUp,
        trendHint: TREND_HINT,
        loading: adherentLoading,
      },
      {
        title: "Sorties",
        value: formatNumber(statsData.totalSorties),
        icon: FiCalendar,
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        textColor: "text-emerald-600 dark:text-emerald-400",
        subValue: `${formatNumber(statsData.plannedSorties)} planifiées • ${formatNumber(statsData.ongoingSorties)} en cours • ${formatNumber(statsData.completedSorties)} terminées`,
        trend: trends?.sorties?.trend,
        trendUp: trends?.sorties?.trendUp,
        trendHint: TREND_HINT,
        loading: sortieLoading,
      },
      {
        title: "Chiffre d'affaires",
        value: formatCurrency(statsData.totalPaiementsAmount),
        icon: FiDollarSign,
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-600 dark:text-purple-400",
        subValue: `${formatNumber(statsData.validatedPaiements)} validés • ${formatNumber(statsData.pendingPaiements)} en attente`,
        trend: trends?.chiffreAffaires?.trend,
        trendUp: trends?.chiffreAffaires?.trendUp,
        trendHint: TREND_HINT,
        loading: paiementLoading,
      },
      {
        title: "Formations",
        value: formatNumber(statsData.totalFormations),
        icon: FiAward,
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        textColor: "text-orange-600 dark:text-orange-400",
        subValue: `${formatNumber(statsData.activeFormations)} en cours • ${formatNumber(statsData.completedFormations)} terminées`,
        trend: trends?.formations?.trend,
        trendUp: trends?.formations?.trendUp,
        trendHint: TREND_HINT,
        loading: formationLoading,
      },
    ],
    [
      statsData,
      trends,
      adherentLoading,
      sortieLoading,
      paiementLoading,
      formationLoading,
    ],
  );

  // Statistiques secondaires
  const secondaryStats = useMemo(
    () => [
      {
        title: "Plongées",
        value: formatNumber(statsData.totalPlongees),
        icon: FiActivity,
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        textColor: "text-rose-600 dark:text-rose-400",
        subValue:
          statsData.avgDepth > 0
            ? `Profondeur moyenne: ${formatNumber(statsData.avgDepth)}m`
            : "Aucune plongée",
        trend: trends?.plongees?.trend,
        trendUp: trends?.plongees?.trendUp,
        trendHint: TREND_HINT,
        loading: plongeeLoading,
      },
      {
        title: "Matériel disponible",
        value: `${formatNumber(statsData.availableMateriels)}/${formatNumber(statsData.totalMateriels)}`,
        icon: FiPackage,
        bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
        textColor: "text-cyan-600 dark:text-cyan-400",
        subValue:
          statsData.totalMateriels > 0
            ? `${Math.round((statsData.availableMateriels / statsData.totalMateriels) * 100)}% du stock`
            : "Aucun matériel",
        trend: trends?.materiel?.trend,
        trendUp: trends?.materiel?.trendUp,
        trendHint: TREND_HINT,
        loading: materielLoading,
      },
    ],
    [statsData, trends, plongeeLoading, materielLoading],
  );

  // Indicateurs CDC 3.6.2 non couverts par mainStats/secondaryStats — soit
  // calculés côté back (taux/comptes agrégés cross-service), soit dérivés ici
  // des stats déjà chargées (moyenne plongées/adhérent).
  const tertiaryStats = useMemo(() => {
    const moyennePlongees =
      statsData.totalAdherents > 0
        ? statsData.totalPlongees / statsData.totalAdherents
        : 0;

    return [
      {
        title: "Remplissage sorties",
        value:
          indicateurs?.tauxRemplissageSorties === null ||
          indicateurs?.tauxRemplissageSorties === undefined
            ? "N/D"
            : `${indicateurs.tauxRemplissageSorties}%`,
        icon: FiPercent,
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        textColor: "text-indigo-600 dark:text-indigo-400",
        subValue: "Taux moyen de places occupées",
        valueHint: REMPLISSAGE_HINT,
        loading: indicateursLoading,
      },
      {
        title: "Plongées / adhérent",
        value: moyennePlongees.toFixed(1),
        icon: FiTrendingUp,
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        textColor: "text-teal-600 dark:text-teal-400",
        subValue: "Moyenne club",
        // Dérivée de statsData (adhérents + plongées), pas des indicateurs.
        loading: adherentLoading || plongeeLoading,
      },
      {
        title: "Renouvellement adhésions",
        value:
          indicateurs?.tauxRenouvellementAdhesions === null ||
          indicateurs?.tauxRenouvellementAdhesions === undefined
            ? "N/D"
            : `${indicateurs.tauxRenouvellementAdhesions}%`,
        icon: FiRefreshCw,
        bgColor: "bg-sky-50 dark:bg-sky-900/20",
        textColor: "text-sky-600 dark:text-sky-400",
        subValue: "Vs l'année précédente",
        valueHint: RENOUVELLEMENT_HINT,
        loading: indicateursLoading,
      },
      {
        title: "Matériel à réviser",
        value:
          indicateurs?.nbMaterielAReviser === null ||
          indicateurs?.nbMaterielAReviser === undefined
            ? "N/D"
            : formatNumber(indicateurs.nbMaterielAReviser),
        icon: FiTool,
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        textColor: "text-amber-600 dark:text-amber-400",
        subValue: "Échéance proche ou dépassée",
        loading: indicateursLoading,
      },
      {
        title: "Adhérents sans plongée 6 mois",
        value:
          indicateurs?.nbAdherentsInactifs === null ||
          indicateurs?.nbAdherentsInactifs === undefined
            ? "N/D"
            : formatNumber(indicateurs.nbAdherentsInactifs),
        icon: FiUserX,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        textColor: "text-red-600 dark:text-red-400",
        subValue: "À relancer",
        loading: indicateursLoading,
      },
    ];
  }, [statsData, indicateurs, indicateursLoading, adherentLoading, plongeeLoading]);

  // Données graphiques
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

  // Chaque graphique n'attend que ses propres dépendances (voir
  // monthlyActivityData/statusData ci-dessus), pas les 6 requêtes de stats.
  const barChartLoading = adherentLoading || sortieLoading || paiementLoading;
  const pieChartLoading = adherentLoading;

  return (
    <div className="min-h-screen from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
      {/* Sortie la plus proche + compte à rebours — visible d'un coup d'œil
          plutôt que noyée dans la liste des sorties. Masquée pour le
          trésorier, voir canSeeSorties ci-dessus.
          Rendue AVANT le `if (isLoading)` qui suivait ici : ce composant
          gère son propre chargement (useSorties/useInscriptions, pas les 6
          useGetStats ci-dessus) et n'a aucun besoin d'attendre les stats.
          Avant ce correctif, il restait démonté (donc ne lançait même pas
          sa propre requête) tant qu'un seul des 6 useGetStats traînait —
          une attente en cascade évitable, pas seulement perçue : chaque
          seconde de plus prise par exemple par les stats paiements
          retardait d'autant le déclenchement de la requête sorties de
          cette carte, alors que les deux pourraient partir en parallèle
          dès le montage de la page. Même chose pour RecentActivity plus
          bas, qui gère aussi son propre chargement (voir son composant). */}
      {canSeeSorties && <ProchaineSortieCard />}

      {/* Bannière d'erreur */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-600 dark:text-amber-400 text-xl">
              <FiAlertTriangle className="w-5 h-5" />
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

      {/* Statistiques principales — chaque StatsCard reçoit son propre
          `loading` (voir stat.loading ci-dessus, transmis par {...stat}) :
          affichée dès que SA requête à elle est prête, sans attendre les
          5 autres. Plus de gate global ici (voir git history pour l'ancien
          `if (isLoading) return <LoadingSpinner />` qui bloquait tout). */}
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
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
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
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Indicateurs de pilotage (CDC 3.6.2) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        {tertiaryStats.map((stat) => (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Graphiques — même principe : chacun n'attend que les stats dont il
          dépend réellement (voir barChartLoading/pieChartLoading), pas les
          6 requêtes. Squelette de même hauteur que le graphique final
          (300px/260px, cf. BarChart.jsx/PieChart.jsx) pour éviter un saut
          de mise en page quand la vraie donnée arrive. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
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
          {barChartLoading ? (
            <div
              className="h-[300px] rounded-2xl bg-gray-50 dark:bg-slate-700/40 animate-pulse"
              aria-hidden="true"
            />
          ) : (
            <BarChart data={monthlyActivityData} />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.15 }}
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
          {pieChartLoading ? (
            <div
              className="h-[260px] rounded-2xl bg-gray-50 dark:bg-slate-700/40 animate-pulse"
              aria-hidden="true"
            />
          ) : (
            <PieChart data={statusData} />
          )}
        </motion.div>
      </div>

      {/* Activité récente */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
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
