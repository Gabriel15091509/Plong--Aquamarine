import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import AttributionList from "../../components/Attribution/AttributionList";

import ErrorState from "../../components/Common/ErrorState";

const AttributionsPage = () => {
  const { hasRole } = useAuth();
  // Le titre reflète la portée réelle des données reçues (voir
  // AttributionService.getAll côté backend) : un président gère toutes les
  // attributions, un moniteur/adhérent ne voit ici que les siennes (les
  // sorties qu'il encadre / son propre matériel) — "Gestion" serait trompeur
  // pour un rôle qui ne peut ni créer ni modifier quoi que ce soit ici (voir
  // AttributionList.jsx, canManageAttribution).
  const canManageAttribution = hasRole(["president"]);
  const { useGetAll } = useAttributions();
  const { data, isLoading, error } = useGetAll();

  const attributions = data?.data || [];

  // Le chargement est géré par AttributionList elle-même (son propre
  // squelette liste), pour éviter un double reflet.
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
            {canManageAttribution
              ? "Gestion des attributions de matériel"
              : "Mes attributions de matériel"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : attributions.length} attributions enregistrées
          </p>
        </div>
      </div>

      <div>
        <AttributionList />
      </div>
    </motion.div>
  );
};

export default AttributionsPage;
