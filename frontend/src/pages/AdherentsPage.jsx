/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiFilter,
  FiUsers,
  FiTrendingUp,
  FiUserCheck,
  FiUserX,
  FiChevronRight,
  FiBarChart2,
} from "react-icons/fi";
import { useAdherents } from "../hooks/useAdherents";
import AdherentList from "../components/Adherent/AdherentList";
import LoadingSpinner from "../components/Common/LoadingSpinner";

// ✅ Configuration des statuts d'adhérents
const ADHERENT_STATUS = [
  { value: "all", label: "📊 Tous les statuts" },
  { value: "Actif", label: "✅ Actif" },
  { value: "Inactif", label: "⛔ Inactif" },
  { value: "Suspendu", label: "⏸️ Suspendu" },
];

const AdherentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const { useGetAll } = useAdherents();
  const { data, isLoading, error } = useGetAll();

  const adherents = data?.data || [];

  const stats = {
    total: adherents.length,
    actifs: adherents.filter((a) => a.statut === "Actif").length,
    inactifs: adherents.filter((a) => a.statut === "Inactif").length,
    suspendus: adherents.filter((a) => a.statut === "Suspendu").length,
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  // ✅ 4 STATISTIQUES SUR UNE MÊME LIGNE
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
      label: "Actifs",
      value: stats.actifs,
      icon: FiUserCheck,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/30",
    },
    {
      label: "Inactifs",
      value: stats.inactifs,
      icon: FiUserX,
      color: "red",
      bg: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/30",
    },
    {
      label: "Suspendus",
      value: stats.suspendus,
      icon: FiFilter,
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
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent"
          >
            Adhérents
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            Gestion des adhérents du club
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50"
        >
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.total} adhérents
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiUserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.actifs} actifs
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bouton Nouvel adhérent */}
      <div className="flex justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/adherents/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-300"
          >
            <FiPlus className="w-4 h-4" />
            Nouvel adhérent
          </Link>
        </motion.div>
      </div>

      {/* ✅ 4 STATISTIQUES SUR UNE MÊME LIGNE - COMPACTES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className={`h-0.5 mt-2 rounded-full bg-gradient-to-r ${stat.color === "gray" ? "from-gray-400 to-gray-500" : stat.color === "green" ? "from-green-500 to-green-600" : stat.color === "red" ? "from-red-500 to-red-600" : "from-yellow-500 to-yellow-600"}`}
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

      {/* Liste des adhérents */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <AdherentList />
      </motion.div>
    </motion.div>
  );
};

export default AdherentsPage;
