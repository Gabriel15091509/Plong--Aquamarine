import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiAward,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiChevronRight,
  FiBarChart2,
} from "react-icons/fi";
import { useFormations } from "../hooks/useFormations";
import FormationList from "../components/Formation/FormationList";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import StatsCard from "../components/Common/StatsCard";

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

  const statCards = [
    {
      title: "Total formations",
      value: statsData.total || 0,
      icon: FiAward,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "En cours",
      value: statsData.enCours || activeArray.length || 0,
      icon: FiTrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100 text-green-600",
    },
    {
      title: "Terminées",
      value: statsData.terminees || 0,
      icon: FiCheckCircle,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      title: "Abandonnées",
      value: statsData.abandonnees || 0,
      icon: FiXCircle,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100 text-red-600",
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
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/formations/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            <FiPlus className="w-5 h-5" />
            Nouvelle formation
            <FiChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Statistiques animées */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
            className={`${stat.bgColor} rounded-2xl p-5 border border-transparent hover:border-${stat.color.split("-")[1]}-200 shadow-sm transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <motion.p
                  className="text-3xl font-bold text-gray-900 dark:text-white mt-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index, type: "spring" }}
                >
                  {stat.value}
                </motion.p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            {/* Barre de progression animée */}
            <motion.div
              className={`h-1 mt-3 rounded-full bg-gradient-to-r ${stat.color}`}
              initial={{ width: 0 }}
              animate={{ width: Math.min(stat.value / 10, 100) + "%" }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
            />
          </motion.div>
        ))}
      </motion.div>

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
