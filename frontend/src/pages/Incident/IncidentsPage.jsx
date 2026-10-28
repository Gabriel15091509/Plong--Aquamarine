import React from "react";
import { motion } from "framer-motion";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import IncidentList from "../../components/Incident/IncidentList";
import TabBar from "../../components/Common/TabBar";
import { useSortieTabs } from "../../hooks/Sortie/useSortieTabs";

import ErrorState from "../../components/Common/ErrorState";

const IncidentsPage = () => {
  const { useGetAll } = useIncidents();
  const { data, isLoading, error } = useGetAll();
  // "Incidents" a rejoint le groupe Sorties (ex-section sidebar "Sécurité",
  // voir Sidebar.jsx + useSortieTabs.js) : même barre d'onglets que
  // SortiesPage.jsx/SortieCartePage.jsx, pour naviguer entre les deux sans
  // repasser par la sidebar.
  const sortieTabs = useSortieTabs();

  const incidents = data?.data || [];

  // Le chargement est géré par IncidentList elle-même (son propre
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
            Gestion des incidents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "…" : incidents.length} incidents enregistrés
          </p>
        </div>
      </div>

      <TabBar tabs={sortieTabs} />

      <div className="mt-4">
        <IncidentList />
      </div>
    </motion.div>
  );
};

export default IncidentsPage;
