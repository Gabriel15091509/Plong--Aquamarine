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

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: FiUsers,
      bgColor: "bg-gray-50 dark:bg-gray-800/50",
      iconBg: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-gray-500 dark:text-gray-400",
      borderColor: "border-gray-200 dark:border-gray-700",
    },
    {
      label: "Actifs",
      value: stats.actifs,
      icon: FiUserCheck,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800/30",
    },
    {
      label: "Inactifs",
      value: stats.inactifs,
      icon: FiUserX,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800/30",
    },
    {
      label: "Suspendus",
      value: stats.suspendus,
      icon: FiFilter,
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg:
        "bg-yellow-100 dark:bg-yellow-800/40 text-yellow-600 dark:text-yellow-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-200 dark:border-yellow-800/30",
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

        {/* Badge statistique rapide */}
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

      {/* Statistiques animées */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, type: "spring" }}
              whileHover={{
                scale: 1.05,
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              className={`${stat.bgColor} ${stat.borderColor} rounded-2xl p-5 border shadow-sm transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.subTextColor}`}>
                    {stat.label}
                  </p>
                  <motion.p
                    className={`text-3xl font-bold ${stat.textColor} mt-1`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * index + 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <motion.div
                className={`h-1 mt-3 rounded-full bg-gradient-to-r ${stat.color}`}
                initial={{ width: 0 }}
                animate={{ width: Math.min(stat.value / 10, 100) + "%" }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Bouton Nouvel adhérent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/adherents/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            <FiPlus className="w-5 h-5" />
            Nouvel adhérent
            <FiChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>

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
