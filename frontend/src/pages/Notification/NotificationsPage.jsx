import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiBell,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useAlertes } from "../../hooks/Alerte/useAlertes";
import { getAlertIcon, getAlertDescription } from "../../utils/alerteDisplay";
import { formatRelativeTime } from "../../utils/helpers";
import ErrorState from "../../components/Common/ErrorState";
import AlerteDetailsModal from "../../components/Alerte/AlerteDetailsModal";

const PAGE_SIZE = 20;

// Historique complet des alertes (lues + non lues), paginé côté backend —
// contrepartie du dropdown de Header.jsx, volontairement plafonné à
// quelques alertes récentes pour ne pas alourdir le navigateur. Accessible
// via "Voir toutes les notifications" dans ce dropdown.
const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [selectedAlerte, setSelectedAlerte] = useState(null);
  const { useGetAllPaginated, useMarkAsRead, useRemove } = useAlertes();
  const { data, isLoading, error, refetch } = useGetAllPaginated({
    page,
    pageSize: PAGE_SIZE,
  });
  const markAsRead = useMarkAsRead();
  const remove = useRemove();

  const alertes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleOpenAlerte = (alerte) => {
    setSelectedAlerte(alerte);
    if (!alerte.read) {
      markAsRead.mutate(alerte.id_alerte);
    }
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    remove.mutate(id);
  };

  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 pt-2 pb-6"
    >
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isLoading ? "…" : `${total} notification${total > 1 ? "s" : ""} au total`}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : alertes.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <FiBell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <div>
            {alertes.map((alerte, index) => {
              const AlertIcon = getAlertIcon(alerte.type);
              const IconComponent = AlertIcon.icon;

              return (
                <div
                  key={alerte.id_alerte}
                  onClick={() => handleOpenAlerte(alerte)}
                  className={`relative flex items-start gap-3 px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                    !alerte.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                  } ${index !== alertes.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""}`}
                >
                  <div className={`p-2.5 rounded-xl ${AlertIcon.bg} flex-shrink-0`}>
                    <IconComponent className={`w-5 h-5 ${AlertIcon.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {alerte.type}
                      {alerte.detail && (
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          {" "}
                          · {alerte.detail}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium mt-0.5">
                      {alerte.adherent_nom || alerte.num_adherent}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {getAlertDescription(alerte)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatRelativeTime(alerte.date_envoi)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRemove(e, alerte.id_alerte)}
                    disabled={remove.isPending}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    <FiX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                  {!alerte.read && (
                    <span className="absolute top-4 right-14 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-primary-600 dark:hover:text-primary-400"
            >
              <FiChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-primary-600 dark:hover:text-primary-400"
            >
              Suivant
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedAlerte && (
        <AlerteDetailsModal
          alerte={selectedAlerte}
          onClose={() => setSelectedAlerte(null)}
        />
      )}
    </motion.div>
  );
};

export default NotificationsPage;
