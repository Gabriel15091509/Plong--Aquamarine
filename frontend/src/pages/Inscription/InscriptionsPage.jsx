import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiClipboard, FiPlus, FiChevronRight } from "react-icons/fi";
import InscriptionList from "../../components/Inscription/InscriptionList";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAuth } from "../../context/AuthContext";

const InscriptionsPage = () => {
  const { user } = useAuth();
  const { useGetAll } = useInscriptions();
  const { data, isLoading, error } = useGetAll();

  const isAdherent = user?.role === "adherent";
  const inscriptions = data?.data || [];

  // Le chargement est géré par InscriptionList elle-même (son propre
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
            <span>Gestion des inscriptions</span>
            <FiClipboard className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdherent
              ? "Vos inscriptions aux sorties de plongée"
              : `${isLoading ? "…" : inscriptions.length} inscriptions enregistrées`}
          </p>
        </div>
      </div>

      {/* Liste des inscriptions */}
      <div>
        <InscriptionList />
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? "…" : inscriptions.length} inscriptions • Dernière mise à jour :{" "}
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

export default InscriptionsPage;
