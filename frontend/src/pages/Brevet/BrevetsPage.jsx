import React from "react";
import { motion } from "framer-motion";
import { useBrevets } from "../../hooks/Brevet/useBrevets";
import { useAuth } from "../../context/AuthContext";
import BrevetList from "../../components/Brevet/BrevetList";
import ErrorState from "../../components/Common/ErrorState";

// Historique des niveaux/brevets — président/moniteur voient tout le club,
// un adhérent ne voit que le sien (scope posé côté backend, voir
// BrevetList.jsx). Le chargement est géré par BrevetList elle-même (son
// propre squelette liste), pour éviter un double reflet.
const BrevetsPage = () => {
  const { hasRole } = useAuth();
  const isAdherent = hasRole(["adherent"]);
  const { useGetAll } = useBrevets();
  const { data, isLoading, error } = useGetAll();

  const brevets = data?.data || [];

  if (error) return <ErrorState />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 pt-2 pb-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isAdherent ? "Mes brevets" : "Brevets des adhérents"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading
              ? "…"
              : isAdherent
                ? `${brevets.length} niveau(x) obtenu(s)`
                : `${brevets.length} brevet(s) enregistré(s)`}
          </p>
        </div>
      </div>

      <BrevetList />
    </motion.div>
  );
};

export default BrevetsPage;
