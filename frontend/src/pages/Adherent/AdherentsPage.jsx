/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import AdherentList from "../../components/Adherent/AdherentList";

/**
 * Page principale de gestion des adhérents
 */
const AdherentsPage = () => {
  const { useGetAll } = useAdherents();
  const { data, isLoading, error } = useGetAll();

  const adherents = data?.data || [];

  // Gestion de l'état d'erreur — le chargement est géré par AdherentList
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
            Gestion des adhérents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : adherents.length} membres dans la communauté
          </p>
        </div>

        {/* Bouton d'ajout */}
      </div>

      {/* Liste des adhérents */}
      <div>
        <AdherentList />
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? "…" : adherents.length} adhérents • Dernière mise à jour :{" "}
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

export default AdherentsPage;
