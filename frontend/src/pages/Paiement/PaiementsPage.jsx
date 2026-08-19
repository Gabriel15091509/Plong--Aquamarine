/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiDollarSign, FiPlus, FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import PaiementList from "../../components/Paiement/PaiementList";
import { useAuth } from "../../context/AuthContext";
import paiementService from "../../services/Paiement/paiementService";

import ErrorState from "../../components/Common/ErrorState";

// "YYYY-MM" du mois en cours, pour préremplir le sélecteur d'export.
const moisCourant = () => new Date().toISOString().slice(0, 7);

const PaiementsPage = () => {
  const { useGetAll } = usePaiements();
  const { data, isLoading, error } = useGetAll();
  const { hasRole } = useAuth();
  const canExport = hasRole(["president", "tresorier"]);

  const [mois, setMois] = useState(moisCourant);
  const [exporting, setExporting] = useState(false);

  const paiements = data?.data || [];

  // Le chargement est géré par PaiementList elle-même (son propre
  // squelette liste), pour éviter un double reflet.
  if (error) return <ErrorState />;

  // Export CSV mensuel (CDC §8.3) : bornes du mois sélectionné, en tenant
  // compte du nombre de jours réel (new Date(year, month, 0) = dernier jour
  // du mois précédent le mois `month`, donc du mois sélectionné ici).
  const handleExport = async () => {
    const [year, month] = mois.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

    setExporting(true);
    try {
      await paiementService.exportCsv(startDate, endDate);
    } catch (err) {
      toast.error("Échec de l'export des paiements");
    } finally {
      setExporting(false);
    }
  };

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
            <span>Gestion des paiements</span>
            <FiDollarSign className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : paiements.length} paiements enregistrés
          </p>
        </div>

        {canExport && (
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              title="Exporter les paiements du mois sélectionné en CSV"
            >
              <FiDownload className="w-4 h-4" />
              {exporting ? "Export…" : "Exporter (CSV)"}
            </button>
          </div>
        )}
      </div>

      {/* Liste des paiements */}
      <div>
        <PaiementList />
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? "…" : paiements.length} paiements • Dernière mise à jour :{" "}
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

export default PaiementsPage;
