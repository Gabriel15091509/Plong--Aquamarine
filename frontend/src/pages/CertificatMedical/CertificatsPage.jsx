/* eslint-disable no-unused-vars */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiFileText, FiHeart, FiChevronRight } from "react-icons/fi";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import CertificatList from "../../components/CertificatMedical/CertificatList";

import ErrorState from "../../components/Common/ErrorState";

const CertificatsPage = () => {
  const { useGetAll } = useCertificats();
  const { data, isLoading, error } = useGetAll();

  const certificats = data?.data || [];

  // Le chargement est géré par CertificatList elle-même (son propre
  // squelette liste), pour éviter un double reflet.
  if (error) return <ErrorState />;

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
            <span>Certificats Médicaux</span>
            <FiHeart className="w-5 h-5 text-rose-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : certificats.length} certificats enregistrés
          </p>
        </div>
      </div>

      {/* Liste des certificats */}
      <div>
        <CertificatList />
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? "…" : certificats.length} certificats • Dernière mise à jour :{" "}
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

export default CertificatsPage;
