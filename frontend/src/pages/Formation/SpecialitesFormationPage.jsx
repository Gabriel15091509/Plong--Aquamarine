import React from "react";
import { motion } from "framer-motion";
import { FiAward } from "react-icons/fi";
import { useSpecialitesFormation } from "../../hooks/Formation/useSpecialitesFormation";
import SpecialiteFormationList from "../../components/Formation/SpecialiteFormationList";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const SpecialitesFormationPage = () => {
  const { useGetAll } = useSpecialitesFormation();
  const { data, isLoading, error } = useGetAll();

  const specialites = data?.data || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <span>Spécialités de formation</span>
            <FiAward className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {specialites.length} spécialités enregistrées
          </p>
        </div>
      </div>

      <div>
        <SpecialiteFormationList />
      </div>
    </motion.div>
  );
};

export default SpecialitesFormationPage;
