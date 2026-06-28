import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiPackage, FiTool } from "react-icons/fi";
import { useMateriels } from "../hooks/useMateriels";
import MaterielList from "../components/Materiel/MaterielList";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import StatsCard from "../components/Common/StatsCard";

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

  const statCards = [
    {
      title: "Total matériel",
      value: statsData.total,
      icon: FiPackage,
      color: "from-blue-500 to-blue-600",
      subValue:
        statsData.total > 0 ? "Équipements enregistrés" : "Aucun matériel",
    },
    {
      title: "Disponible",
      value: statsData.availableCount,
      icon: FiTool,
      color: "from-green-500 to-green-600",
      subValue:
        statsData.total > 0
          ? `${Math.round((statsData.availableCount / statsData.total) * 100)}% du stock`
          : "Aucun matériel disponible",
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
          <h1 className="text-2xl font-bold text-gray-800">Matériel</h1>
          <p className="text-gray-500 mt-1">Gestion du matériel du club</p>
        </div>
        <Link
          to="/materiels/create"
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nouveau matériel
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

      <MaterielList />
    </motion.div>
  );
};

export default MaterielsPage;
