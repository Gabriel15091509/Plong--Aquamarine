import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiActivity,
  FiChevronRight,
  FiDroplet,
  FiBarChart2,
} from "react-icons/fi";
import { usePlongees } from "../hooks/usePlongees";
import PlongeeList from "../components/Plongee/PlongeeList";
import LoadingSpinner from "../components/Common/LoadingSpinner";

// ✅ Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const PlongeesPage = () => {
  const { useGetStats } = usePlongees();

  const { data: stats, isLoading } = useGetStats();

  const statsData = useMemo(() => {
    let totalPlongees = 0;
    let avgDepth = 0;
    let typeCount = 0;
    let maxDepth = 0;
    let minDepth = 0;

    const rawData = stats?.data;

    if (Array.isArray(rawData) && rawData.length > 0) {
      totalPlongees = rawData.reduce(
        (sum, s) => sum + (parseInt(s.count) || 0),
        0,
      );
      typeCount = rawData.length;

      const depths = rawData.map((s) => parseFloat(s.avg_depth) || 0);
      const validDepths = depths.filter((d) => d > 0);

      if (validDepths.length > 0) {
        avgDepth =
          validDepths.reduce((sum, d) => sum + d, 0) / validDepths.length;
        maxDepth = Math.max(...validDepths);
        minDepth = Math.min(...validDepths);
      }
    } else if (typeof rawData === "number") {
      totalPlongees = rawData;
      typeCount = 1;
    } else if (rawData && typeof rawData === "object") {
      totalPlongees = rawData.total || rawData.count || 0;
      typeCount = rawData.types || rawData.typeCount || 0;
      avgDepth = rawData.profondeurMoyenne || rawData.avgDepth || 0;
      maxDepth = rawData.profondeurMax || rawData.maxDepth || 0;
      minDepth = rawData.profondeurMin || rawData.minDepth || 0;
    }

    return {
      totalPlongees: Math.round(totalPlongees) || 0,
      avgDepth: Math.round(avgDepth) || 0,
      typeCount: Math.round(typeCount) || 0,
      maxDepth: Math.round(maxDepth) || 0,
      minDepth: Math.round(minDepth) || 0,
    };
  }, [stats]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: "Total plongées",
      value: statsData.totalPlongees,
      icon: FiTrendingUp,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconBg:
        "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-gray-500 dark:text-gray-400",
      borderColor: "border-blue-200 dark:border-blue-800/30",
      subValue:
        statsData.totalPlongees > 0
          ? `${statsData.typeCount} types différents`
          : "Aucune plongée enregistrée",
    },
    {
      title: "Profondeur moyenne",
      value: statsData.avgDepth > 0 ? `${statsData.avgDepth}m` : "—",
      icon: FiClock,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-gray-500 dark:text-gray-400",
      borderColor: "border-green-200 dark:border-green-800/30",
      subValue:
        statsData.avgDepth > 0
          ? `Max: ${statsData.maxDepth}m • Min: ${statsData.minDepth}m`
          : "Aucune donnée de profondeur",
    },
    {
      title: "Types de plongées",
      value: statsData.typeCount,
      icon: FiActivity,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBg:
        "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-gray-500 dark:text-gray-400",
      borderColor: "border-purple-200 dark:border-purple-800/30",
      subValue:
        statsData.typeCount > 0
          ? "Différents types pratiqués"
          : "Aucun type enregistré",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* En-tête animé */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400"
          >
            Plongées
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            Historique des plongées du club
          </motion.p>
        </div>

        {/* Badge statistique rapide */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-xl border border-cyan-200 dark:border-cyan-800/50"
        >
          <div className="flex items-center gap-2">
            <FiDroplet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.totalPlongees} plongées
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiBarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.avgDepth > 0 ? `${statsData.avgDepth}m` : "—"}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Statistiques animées */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              y: -5,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
            className={`${stat.bgColor} ${stat.borderColor} rounded-2xl p-6 border shadow-sm transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${stat.subTextColor}`}>
                  {stat.title}
                </p>
                <motion.p
                  className={`text-3xl font-bold ${stat.textColor} mt-1`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index, type: "spring" }}
                >
                  {stat.value}
                </motion.p>
                {stat.subValue && (
                  <p className={`text-xs ${stat.subTextColor} mt-1`}>
                    {stat.subValue}
                  </p>
                )}
              </div>
              <div
                className={`w-14 h-14 rounded-xl ${stat.iconBg} flex items-center justify-center`}
              >
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
            {/* Barre de progression animée */}
            <motion.div
              className={`h-1 mt-4 rounded-full bg-gradient-to-r ${stat.color}`}
              initial={{ width: 0 }}
              animate={{ width: Math.min(stat.value / 10, 100) + "%" }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Liste des plongées avec animation d'entrée */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <PlongeeList />
      </motion.div>
    </motion.div>
  );
};

export default PlongeesPage;
