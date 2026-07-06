/* eslint-disable no-unused-vars */
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAward,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiBookOpen,
  FiUsers,
} from "react-icons/fi";
import { useFormations } from "../hooks/useFormations";
import FormationList from "../components/Formation/FormationList";
import LoadingSpinner from "../components/Common/LoadingSpinner";

const FormationsPage = () => {
  const { useGetStats, useGetActive } = useFormations();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: active, isLoading: activeLoading } = useGetActive();

  const isLoading = statsLoading || activeLoading;
  if (isLoading) return <LoadingSpinner />;

  const statsData = stats?.data || {};
  const activeArray = Array.isArray(active?.data)
    ? active.data
    : Array.isArray(active)
      ? active
      : [];

  // ✅ 4 STATISTIQUES SUR UNE MÊME LIGNE - COMPACTES
  const statCards = [
    {
      title: "Total",
      value: statsData.total || 0,
      icon: FiBarChart2,
      color: "gray",
      bg: "bg-gray-50 dark:bg-gray-800/50",
      iconBg: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-700",
      subLabel: "Formations",
    },
    {
      title: "En cours",
      value: statsData.enCours || activeArray.length || 0,
      icon: FiTrendingUp,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/30",
      subLabel: "Actives",
    },
    {
      title: "Terminées",
      value: statsData.terminees || 0,
      icon: FiCheckCircle,
      color: "blue",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg:
        "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800/30",
      subLabel: "Validées",
    },
    {
      title: "Abandonnées",
      value: statsData.abandonnees || 0,
      icon: FiXCircle,
      color: "red",
      bg: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/30",
      subLabel: "Non terminées",
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
            Formations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            Gestion des formations du club
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
            <FiBookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.total || 0} formations
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.enCours || activeArray.length || 0} en cours
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statsData.terminees || 0} terminées
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

      {/* Liste des formations avec animation d'entrée */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <FormationList />
      </motion.div>
    </motion.div>
  );
};

export default FormationsPage;
