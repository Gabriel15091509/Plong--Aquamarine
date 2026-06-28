import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiAward, FiTrendingUp } from "react-icons/fi";
import { useFormations } from "../hooks/useFormations";
import FormationList from "../components/Formation/FormationList";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import StatsCard from "../components/Common/StatsCard";

const FormationsPage = () => {
  const { useGetStats, useGetActive } = useFormations();
  
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: active, isLoading: activeLoading } = useGetActive();

  const isLoading = statsLoading || activeLoading;

  const statsData = useMemo(() => {
    let total = 0;
    let activeCount = 0;
    
    const rawData = stats?.data;
    if (Array.isArray(rawData) && rawData.length > 0) {
      total = rawData.reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
    } else if (typeof rawData === 'number') {
      total = rawData;
    } else if (rawData && typeof rawData === 'object') {
      total = rawData.total || rawData.count || 0;
    }
    
    const activeRaw = active?.data;
    if (Array.isArray(activeRaw)) {
      activeCount = activeRaw.length;
    } else if (typeof activeRaw === 'number') {
      activeCount = activeRaw;
    } else if (activeRaw && typeof activeRaw === 'object') {
      activeCount = activeRaw.total || activeRaw.count || 0;
    }
    
    return {
      total: Math.round(total) || 0,
      activeCount: Math.round(activeCount) || 0,
    };
  }, [stats, active]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: "Total formations",
      value: statsData.total,
      icon: FiAward,
      color: "from-blue-500 to-blue-600",
      subValue: statsData.total > 0 ? "Formations enregistrées" : "Aucune formation",
    },
    {
      title: "En cours",
      value: statsData.activeCount,
      icon: FiTrendingUp,
      color: "from-green-500 to-green-600",
      subValue: statsData.activeCount > 0 
        ? "Formations actives" 
        : "Aucune formation en cours",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Formations</h1>
          <p className="text-gray-500 mt-1">Gestion des formations du club</p>
        </div>
        <Link
          to="/formations/create"
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nouvelle formation
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <FormationList />
    </motion.div>
  );
};

export default FormationsPage;