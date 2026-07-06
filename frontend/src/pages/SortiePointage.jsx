import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUsers,
  FiBarChart2,
  FiArrowLeft,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiAlertTriangle,
} from "react-icons/fi";
import { useSorties } from "../hooks/useSorties";
import { useInscriptions } from "../hooks/useInscriptions";
import PresenceCheck from "../components/Inscription/PresenceCheck";
import LoadingSpinner from "../components/Common/LoadingSpinner";

// ✅ Animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
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

  const statCards = [
    {
      label: "Total inscrits",
      value: stats.total,
      icon: FiUsers,
      color: "blue",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg:
        "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Présents",
      value: stats.present,
      icon: FiCheckCircle,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
    },
    {
      label: "Absents",
      value: stats.absent,
      icon: FiXCircle,
      color: "red",
      bg: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
    },
    {
      label: "Non pointés",
      value: stats.notChecked,
      icon: FiClock,
      color: "yellow",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg:
        "bg-yellow-100 dark:bg-yellow-800/40 text-yellow-600 dark:text-yellow-400",
    },
  ];

  const filterOptions = [
    { key: "all", label: `Tous (${stats.total})` },
    { key: "present", label: `✅ Présents (${stats.present})` },
    { key: "absent", label: `❌ Absents (${stats.absent})` },
    { key: "not-checked", label: `⏳ Non pointés (${stats.notChecked})` },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête avec effet glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-800 dark:via-blue-800 dark:to-cyan-800 p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-3 text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-white">
              {sortie?.data?.type || "Pointage"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <FiMapPin className="w-4 h-4" />
                {sortie?.data?.lieu} • {sortie?.data?.site}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4" />
                {formatDate(sortie?.data?.date_heure)}
              </span>
              <span className="flex items-center gap-1.5">
                <FiUsers className="w-4 h-4" />
                {stats.total} inscrits
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
              <span className="text-white/70 text-xs">Total</span>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {isFutureSortie && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <FiAlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
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
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`${stat.bg} rounded-xl border border-gray-200 dark:border-gray-800 p-4 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
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
        {filterOptions.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filter === item.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
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
                <FiBarChart2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
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
    </div>
  );
};

export default SortiePointage;
