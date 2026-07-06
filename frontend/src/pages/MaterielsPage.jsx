/* eslint-disable no-unused-vars */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPackage,
  FiTool,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
  FiBox,
} from "react-icons/fi";
import { useMateriels } from "../hooks/useMateriels";
import MaterielList from "../components/Materiel/MaterielList";
import LoadingSpinner from "../components/Common/LoadingSpinner";

const MaterielsPage = () => {
  const { useGetStats, useGetAvailable } = useMateriels();

  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: available, isLoading: availableLoading } = useGetAvailable();

  const isLoading = statsLoading || availableLoading;

  const statsData = useMemo(() => {
    let total = 0;
    let availableCount = 0;

    const rawData = stats?.data;
    if (Array.isArray(rawData) && rawData.length > 0) {
      total = rawData.reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
    } else if (typeof rawData === "number") {
      total = rawData;
    } else if (rawData && typeof rawData === "object") {
      total = rawData.total || rawData.count || 0;
    }

    const availableRaw = available?.data;
    if (Array.isArray(availableRaw)) {
      availableCount = availableRaw.length;
    } else if (typeof availableRaw === "number") {
      availableCount = availableRaw;
    } else if (availableRaw && typeof availableRaw === "object") {
      availableCount = availableRaw.total || availableRaw.count || 0;
    }

    return {
      total: Math.round(total) || 0,
      availableCount: Math.round(availableCount) || 0,
    };
  }, [stats, available]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // ✅ 4 STATISTIQUES SUR UNE MÊME LIGNE - COMPACTES
  const statCards = [
    {
      title: "Total",
      value: statsData.total,
      icon: FiBarChart2,
      color: "gray",
      bg: "bg-gray-50 dark:bg-gray-800/50",
      iconBg: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-700",
      subLabel: "Équipements",
    },
    {
      title: "Disponible",
      value: statsData.availableCount,
      icon: FiCheckCircle,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/30",
      subLabel: "Prêt à l'emploi",
    },
    {
      title: "Disponibilité",
      value: statsData.total > 0
        ? `${Math.round((statsData.availableCount / statsData.total) * 100)}%`
        : "0%",
      icon: FiTool,
      color: "blue",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800/30",
      subLabel: "Taux de disponibilité",
    },
    {
      title: "Indisponible",
      value: statsData.total - statsData.availableCount,
      icon: FiAlertCircle,
      color: "red",
      bg: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/30",
      subLabel: "En maintenance",
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
            Matériel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            Gestion du matériel du club
          </motion.p>
        </div>

        {/* Badge statistique rapide */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-800/50"
        >
          <div className="flex items-center gap-2">
            <FiBox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.total} équipements
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.availableCount} disponibles
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiTool className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.total > 0
                ? Math.round((statsData.availableCount / statsData.total) * 100)
                : 0}
              % dispo
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ✅ 4 STATISTIQUES SUR UNE MÊME LIGNE - COMPACTES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
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
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {stat.subLabel}
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
                className={`h-0.5 mt-2 rounded-full bg-gradient-to-r ${
                  stat.color === "gray"
                    ? "from-gray-400 to-gray-500"
                    : stat.color === "green"
                      ? "from-green-500 to-green-600"
                      : stat.color === "blue"
                        ? "from-blue-500 to-blue-600"
                        : "from-red-500 to-red-600"
                }`}
                initial={{ width: 0 }}
                animate={{
                  width:
                    statsData.total > 0
                      ? `${(stat.value / statsData.total) * 100}%`
                      : "0%",
                }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Liste du matériel avec animation d'entrée */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <MaterielList />
      </motion.div>
    </motion.div>
  );
};

export default MaterielsPage;