import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiTrendingUp, FiClock, FiActivity } from "react-icons/fi";
import { usePlongees } from "../hooks/usePlongees";
import PlongeeList from "../components/Plongee/PlongeeList";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import StatsCard from "../components/Common/StatsCard";

const PlongeesPage = () => {
  const { useGetStats } = usePlongees();
  
  // ✅ Appel du hook AVANT le return conditionnel
  const { data: stats, isLoading } = useGetStats();

  // ✅ Calcul des statistiques - AVANT le return conditionnel
  const statsData = useMemo(() => {
    let totalPlongees = 0;
    let avgDepth = 0;
    let typeCount = 0;
    let maxDepth = 0;
    let minDepth = 0;
    
    const rawData = stats?.data;
    
    if (Array.isArray(rawData) && rawData.length > 0) {
      totalPlongees = rawData.reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
      typeCount = rawData.length;
      
      const depths = rawData.map(s => parseFloat(s.avg_depth) || 0);
      const validDepths = depths.filter(d => d > 0);
      
      if (validDepths.length > 0) {
        avgDepth = validDepths.reduce((sum, d) => sum + d, 0) / validDepths.length;
        maxDepth = Math.max(...validDepths);
        minDepth = Math.min(...validDepths);
      }
    } else if (typeof rawData === 'number') {
      totalPlongees = rawData;
      typeCount = 1;
    } else if (rawData && typeof rawData === 'object') {
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

  // ✅ MAINTENANT le return conditionnel
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // ✅ Statistiques
  const statCards = [
    {
      title: "Total plongées",
      value: statsData.totalPlongees,
      icon: FiTrendingUp,
      color: "from-blue-500 to-blue-600",
      subValue: statsData.totalPlongees > 0 
        ? `${statsData.typeCount} types différents` 
        : "Aucune plongée enregistrée",
    },
    {
      title: "Profondeur moyenne",
      value: statsData.avgDepth > 0 ? `${statsData.avgDepth}m` : "—",
      icon: FiClock,
      color: "from-green-500 to-green-600",
      subValue: statsData.avgDepth > 0 
        ? `Max: ${statsData.maxDepth}m • Min: ${statsData.minDepth}m` 
        : "Aucune donnée de profondeur",
    },
    {
      title: "Types de plongées",
      value: statsData.typeCount,
      icon: FiActivity,
      color: "from-purple-500 to-purple-600",
      subValue: statsData.typeCount > 0 
        ? "Différents types pratiqués" 
        : "Aucun type enregistré",
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
          <h1 className="text-2xl font-bold text-gray-800">Plongées</h1>
          <p className="text-gray-500 mt-1">Historique des plongées du club</p>
        </div>
        <Link
          to="/plongees/create"
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nouvelle plongée
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <PlongeeList />
    </motion.div>
  );
};

export default PlongeesPage;