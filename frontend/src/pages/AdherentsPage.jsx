/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiFilter } from "react-icons/fi";
import { useAdherents } from "../hooks/useAdherents";
import AdherentList from "../components/Adherent/AdherentList";
import LoadingSpinner from "../components/Common/LoadingSpinner";

const AdherentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const { useGetAll } = useAdherents(); // ✅ On récupère useGetAll
  const { data, isLoading, error } = useGetAll(); // ✅ On appelle useGetAll()

  const filteredData = data?.data?.filter((adherent) => {
    const matchesSearch =
      `${adherent.nom} ${adherent.prenom}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      adherent.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    return matchesSearch && adherent.statut === filter;
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Adhérents</h1>
          <p className="text-gray-500 mt-1">Gestion des adhérents du club</p>
        </div>
        <Link
          to="/adherents/create"
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nouvel adhérent
        </Link>
      </div>

      <AdherentList />
    </motion.div>
  );
};

export default AdherentsPage;
