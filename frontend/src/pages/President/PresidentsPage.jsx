/* eslint-disable no-unused-vars */
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiShield } from "react-icons/fi";
import { usePresidents } from "../../hooks/President/usePresidents";
import PresidentList from "../../components/President/PresidentList";

/**
 * Page principale de gestion des présidents
 */
const PresidentsPage = () => {
  const { useGetAll } = usePresidents();
  const { data, isLoading, error } = useGetAll();

  const presidents = data?.data || [];

  // Gestion de l'état d'erreur — le chargement est géré par PresidentList
  // elle-même (son propre squelette liste), pour éviter un double reflet.
  if (error)
    return <div className="text-red-500">Erreur : {error.message}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 pt-2 pb-6"
    >
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Gestion des présidents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : presidents.length} présidents enregistrés
          </p>
        </div>
      </div>

      {/* Liste des présidents */}
      <div>
        <PresidentList />
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? "…" : presidents.length} présidents • Dernière mise à jour :{" "}
        {new Date().toLocaleString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </motion.div>
  );
};

export default PresidentsPage;
