import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiFilter,
  FiPieChart,
  FiBarChart2,
  FiTrendingUp,
  FiAlertCircle,
  FiInfo,
  FiList,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import PresenceCheck from "../../components/Inscription/PresenceCheck";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const SortiePointage = () => {
  const { id_sortie } = useParams();
  const navigate = useNavigate();
  const {
    useGetById: useGetSortie,
    useEnregistrerPointage,
    useAnnulerPointage,
  } = useSorties();
  const { useGetAll } = useInscriptions();

  const { data: sortie, isLoading: loadingSortie } = useGetSortie(id_sortie);
  const {
    data: inscriptions,
    isLoading: loadingInscriptions,
    refetch,
  } = useGetAll();
  const enregistrerPointage = useEnregistrerPointage();
  const annulerPointage = useAnnulerPointage();

  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    notChecked: 0,
  });

  const sortieInscriptions = useMemo(() => {
    if (!inscriptions?.data) return [];
    return inscriptions.data.filter((i) => i.id_sortie === parseInt(id_sortie));
  }, [inscriptions, id_sortie]);

  useEffect(() => {
    const total = sortieInscriptions.length;
    const present = sortieInscriptions.filter(
      (i) => i.presence && i.presence_checked,
    ).length;
    const absent = sortieInscriptions.filter(
      (i) => !i.presence && i.presence_checked,
    ).length;
    const notChecked = sortieInscriptions.filter(
      (i) => !i.presence_checked,
    ).length;

    setStats({ total, present, absent, notChecked });
  }, [sortieInscriptions]);

  const filteredInscriptions = useMemo(() => {
    switch (filter) {
      case "present":
        return sortieInscriptions.filter(
          (i) => i.presence && i.presence_checked,
        );
      case "absent":
        return sortieInscriptions.filter(
          (i) => !i.presence && i.presence_checked,
        );
      case "not-checked":
        return sortieInscriptions.filter((i) => !i.presence_checked);
      default:
        return sortieInscriptions;
    }
  }, [sortieInscriptions, filter]);

  const isFutureSortie = useMemo(() => {
    if (!sortie?.data?.date_heure) return false;
    const sortieDay = new Date(sortie.data.date_heure);
    const today = new Date();
    sortieDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return sortieDay > today;
  }, [sortie]);

  const handleCheck = async (id, data) => {
    if (isFutureSortie) return;

    setLoading(true);
    try {
      await enregistrerPointage.mutateAsync({
        id_sortie: parseInt(id_sortie),
        inscriptions: [
          {
            id,
            presence: data.presence,
            absence_reason: data.absence_reason || null,
            absence_justified: data.absence_justified || false,
          },
        ],
      });
      await refetch();
    } catch (error) {
      console.error("Erreur lors du pointage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setLoading(true);
    try {
      await annulerPointage.mutateAsync(id);
      await refetch();
    } catch (error) {
      console.error("Erreur lors de l'annulation du pointage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSortie || loadingInscriptions) return <LoadingSpinner />;

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Cartes de statistiques avec icônes
  const statCards = [
    {
      label: "Total inscrits",
      value: stats.total,
      icon: FiUsers,
      iconClass: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Présents",
      value: stats.present,
      icon: FiCheckCircle,
      iconClass: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Absents",
      value: stats.absent,
      icon: FiXCircle,
      iconClass: "text-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
    },
    {
      label: "Non pointés",
      value: stats.notChecked,
      icon: FiClock,
      iconClass: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
    },
  ];

  const filterOptions = [
    { key: "all", label: "Tous", icon: FiList, count: stats.total },
    { key: "present", label: "Présents", icon: FiCheck, count: stats.present },
    { key: "absent", label: "Absents", icon: FiX, count: stats.absent },
    {
      key: "not-checked",
      label: "Non pointés",
      icon: FiClock,
      count: stats.notChecked,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête avec effet glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-800 dark:via-blue-800 dark:to-cyan-800 p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <motion.button
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-3 text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10"
            >
              <FiArrowLeft className="w-4 h-4" />
              Retour
            </motion.button>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {sortie?.data?.type || "Pointage"}
              </h1>
              <span className="text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                {stats.total} inscrits
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <FiMapPin className="w-3.5 h-3.5" />
                {sortie?.data?.lieu} • {sortie?.data?.site}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5" />
                {formatDate(sortie?.data?.date_heure)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 text-center">
              <span className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                Taux de présence
              </span>
              <p className="text-white text-xl font-bold">
                {stats.total > 0
                  ? Math.round((stats.present / stats.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Message pour sortie future */}
      {isFutureSortie && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Pointage indisponible</p>
            <p className="text-sm opacity-90">
              Cette sortie est prévue plus tard. Le pointage sera possible le
              jour de la sortie.
            </p>
          </div>
        </motion.div>
      )}

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`${stat.bg} ${stat.border} border rounded-xl p-4 transition-all duration-300 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl bg-white/50 dark:bg-white/10 flex items-center justify-center ${stat.iconClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mr-2">
          <FiFilter className="w-4 h-4" />
          <span className="font-medium">Filtrer :</span>
        </div>
        {filterOptions.map((item) => {
          const Icon = item.icon;
          const isActive = filter === item.key;
          return (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(item.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {item.count}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Liste des inscriptions */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        <AnimatePresence>
          {filteredInscriptions.length === 0 ? (
            <motion.div
              {...fadeInUp}
              className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Aucune inscription dans cette catégorie
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Modifiez votre filtre pour voir plus de résultats
              </p>
            </motion.div>
          ) : (
            filteredInscriptions.map((inscription) => (
              <motion.div
                key={inscription.id_inscription}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PresenceCheck
                  inscription={inscription}
                  onCheck={handleCheck}
                  loading={
                    loading ||
                    isFutureSortie ||
                    enregistrerPointage.isLoading ||
                    annulerPointage.isLoading
                  }
                  onCancel={() => handleCancel(inscription.id_inscription)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pied de page avec informations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FiUsers className="w-3 h-3" />
            {stats.total} inscrits
          </span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
          <span className="flex items-center gap-1 text-emerald-500">
            <FiCheckCircle className="w-3 h-3" />
            {stats.present} présents
          </span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
          <span className="flex items-center gap-1 text-red-500">
            <FiXCircle className="w-3 h-3" />
            {stats.absent} absents
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FiInfo className="w-3 h-3" />
          <span>
            Mis à jour le{" "}
            {new Date().toLocaleString("fr-FR", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default SortiePointage;
