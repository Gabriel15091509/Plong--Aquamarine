import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiClipboard,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiBarChart2,
  FiDollarSign,
  FiUserPlus,
  FiPlus,
} from "react-icons/fi";
import InscriptionList from "../components/Inscription/InscriptionList";
import { useInscriptions } from "../hooks/useInscriptions";
import { useAuth } from "../context/AuthContext";

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

const InscriptionsPage = () => {
  const { user } = useAuth();
  const { useGetStats } = useInscriptions();
  const { data: statsData, isLoading } = useGetStats();

  const isAdherent = user?.role === "adherent";
  const isAdmin = ["president", "moniteur", "tresorier"].includes(user?.role);

  const stats = useMemo(() => {
    if (!statsData?.data) {
      return {
        total: 0,
        enAttente: 0,
        confirmees: 0,
        annulees: 0,
        listeAttente: 0,
      };
    }
    return statsData.data;
  }, [statsData]);

  const statCards = [
    {
      label: "Total inscriptions",
      value: stats.total || 0,
      icon: FiBarChart2,
      color: "indigo",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      iconBg:
        "bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-200 dark:border-indigo-800/30",
    },
    {
      label: "En attente",
      value: stats.enAttente || 0,
      icon: FiClock,
      color: "yellow",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg:
        "bg-yellow-100 dark:bg-yellow-800/40 text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-200 dark:border-yellow-800/30",
    },
    {
      label: "Confirmées",
      value: stats.confirmees || 0,
      icon: FiCheckCircle,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/30",
    },
    {
      label: "Annulées",
      value: stats.annulees || 0,
      icon: FiXCircle,
      color: "red",
      bg: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/30",
    },
    {
      label: "Liste d'attente",
      value: stats.listeAttente || 0,
      icon: FiUsers,
      color: "blue",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg:
        "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec effet glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-800 dark:via-blue-800 dark:to-cyan-800 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white tracking-tight"
            >
              Inscriptions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-indigo-100 text-sm mt-1"
            >
              Gestion des inscriptions aux sorties de plongée
            </motion.p>
          </div>

          {/* ✅ Bouton Nouvelle inscription - Visible pour tous */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Link
              to="/inscriptions/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-xl transition-all border border-white/20"
            >
              <FiPlus className="w-4 h-4" />
              {isAdherent ? "M'inscrire" : "Nouvelle inscription"}
            </Link>
          </motion.div>
        </div>

        {/* Badge statistique rapide */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="relative flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10"
        >
          <div className="flex items-center gap-2">
            <FiClipboard className="w-4 h-4 text-white/70" />
            <span className="text-sm font-medium text-white/80">
              {stats.total || 0} inscriptions
            </span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <FiUserPlus className="w-4 h-4 text-white/70" />
            <span className="text-sm font-medium text-white/80">
              {stats.confirmees || 0} confirmées
            </span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-white/70" />
            <span className="text-sm font-medium text-white/80">
              {stats.enAttente || 0} en attente
            </span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-white/70" />
            <span className="text-sm font-medium text-white/80">
              Taux:{" "}
              {stats.total > 0
                ? Math.round((stats.confirmees / stats.total) * 100)
                : 0}
              %
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Statistiques détaillées */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            {...fadeInUp}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`${stat.bg} ${stat.border} rounded-xl border p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
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

      {/* ✅ Message pour les adhérents */}
      {isAdherent && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                Vous êtes connecté en tant qu'adhérent
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Vous pouvez vous inscrire aux sorties. Votre inscription sera
                automatiquement mise en attente et devra être confirmée par un
                moniteur.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Liste des inscriptions avec animation d'entrée */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
      >
        <InscriptionList />
      </motion.div>
    </div>
  );
};

export default InscriptionsPage;
