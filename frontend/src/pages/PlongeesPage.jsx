/* eslint-disable no-unused-vars */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiBarChart2,
  FiDroplet,
} from "react-icons/fi";
import { usePlongees } from "../hooks/usePlongees";
import PlongeeList from "../components/Plongee/PlongeeList";
import LoadingSpinner from "../components/Common/LoadingSpinner";

// ✅ Configuration des statuts de plongées
const PLONGEE_STATUS = [
  { value: "all", label: "📊 Tous les statuts" },
  { value: "valide", label: "✅ Validées" },
  { value: "non_valide", label: "⏳ Non validées" },
];

const PlongeesPage = () => {
  const { useGetAll } = usePlongees();
  const { data, isLoading, error } = useGetAll();

  const plongees = data?.data || [];

  // ✅ Statistiques
  const stats = useMemo(() => {
    const total = plongees.length;
    const valides = plongees.filter((p) => p.valide_moniteur === true).length;
    const nonValides = plongees.filter(
      (p) => p.valide_moniteur === false,
    ).length;
    return { total, valides, nonValides };
  }, [plongees]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  // ✅ 3 STATISTIQUES SUR UNE MÊME LIGNE - COMPACTES
  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: FiBarChart2,
      color: "gray",
      bg: "bg-gray-50 dark:bg-gray-800/50",
      iconBg: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-700",
    },
    {
      label: "Validées",
      value: stats.valides,
      icon: FiCheckCircle,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/30",
    },
    {
      label: "Non validées",
      value: stats.nonValides,
      icon: FiClock,
      color: "yellow",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg:
        "bg-yellow-100 dark:bg-yellow-800/40 text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-200 dark:border-yellow-800/30",
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
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent"
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

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-800/50"
        >
          <div className="flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.total} plongées
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.valides} validées
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ✅ 3 STATISTIQUES SUR UNE MÊME LIGNE - COMPACTES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{
                scale: 1.03,
                y: -3,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              className={`${stat.bg} ${stat.border} rounded-xl border p-3 transition-all shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              {/* ✅ Barre de progression fine */}
              <motion.div
                className={`h-0.5 mt-2 rounded-full bg-gradient-to-r ${stat.color === "gray" ? "from-gray-400 to-gray-500" : stat.color === "green" ? "from-green-500 to-green-600" : "from-yellow-500 to-yellow-600"}`}
                initial={{ width: 0 }}
                animate={{
                  width:
                    stats.total > 0
                      ? `${(stat.value / stats.total) * 100}%`
                      : "0%",
                }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Liste des plongées */}
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
