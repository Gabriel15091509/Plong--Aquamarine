import React from "react";
import { motion } from "framer-motion";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import AttributionList from "../../components/Attribution/AttributionList";

const AttributionsPage = () => {
  const { useGetAll } = useAttributions();
  const { data, isLoading, error } = useGetAll();

  const attributions = data?.data || [];

  // Le chargement est géré par AttributionList elle-même (son propre
  // squelette liste), pour éviter un double reflet.
  if (error)
    return <div className="text-red-500">Erreur : {error.message}</div>;

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
            Gestion des attributions de matériel
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
