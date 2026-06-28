import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiCalendar, FiMapPin } from "react-icons/fi";
import { useSorties } from "../hooks/useSorties";
import SortieList from "../components/Sortie/SortieList";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import StatsCard from "../components/Common/StatsCard";

const SortiesPage = () => {
  const [filter, setFilter] = useState("all");
  const { useGetUpcoming, useGetStats } = useSorties(); // ← CORRECTION: useGetUpcoming au lieu de getUpcoming
  const { data: sorties, isLoading: sortiesLoading } = useGetUpcoming();
  const { data: stats, isLoading: statsLoading } = useGetStats();

  const isLoading = sortiesLoading || statsLoading;

  if (isLoading) return <LoadingSpinner />;

  const filteredSorties = sorties?.data?.filter((sortie) => {
    if (filter === "all") return true;
    return sortie.statut === filter;
  });

  const statCards = [
    {
      title: "Sorties planifiées",
      value:
        stats?.data
          ?.filter((s) => s.statut === "Planifiée")
          .reduce((sum, s) => sum + s.count, 0) || 0,
      icon: FiCalendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Sorties en cours",
      value:
        stats?.data
          ?.filter((s) => s.statut === "En cours")
          .reduce((sum, s) => sum + s.count, 0) || 0,
      icon: FiMapPin,
      color: "from-green-500 to-green-600",
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
          <h1 className="text-2xl font-bold text-gray-800">Sorties</h1>
          <p className="text-gray-500 mt-1">Gestion des sorties et plongées</p>
        </div>
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

      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">Toutes</option>
          <option value="Planifiée">Planifiées</option>
          <option value="En cours">En cours</option>
          <option value="Terminée">Terminées</option>
          <option value="Annulée">Annulées</option>
        </select>
      </div>

      <SortieList sorties={filteredSorties || []} />
    </motion.div>
  );
};

export default SortiesPage;
