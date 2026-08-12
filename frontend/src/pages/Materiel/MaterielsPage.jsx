/* eslint-disable no-unused-vars */
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiTool, FiPlus } from "react-icons/fi";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import MaterielList from "../../components/Materiel/MaterielList";

const MaterielsPage = () => {
  const { useGetAll } = useMateriels();
  const { data, isLoading, error } = useGetAll();

  const materiels = data?.data || [];

  // Le chargement est géré par MaterielList elle-même (son propre
  // squelette liste), pour éviter un double reflet.
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 pt-2 pb-6"
    >
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <span>Gestion du matériel</span>
            <FiTool className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : materiels.length} équipements enregistrés
          </p>
        </div>
      </div>

      {/* Liste du matériel */}
      <div>
        <MaterielList />
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? "…" : materiels.length} équipements • Dernière mise à jour :{" "}
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

export default MaterielsPage;
