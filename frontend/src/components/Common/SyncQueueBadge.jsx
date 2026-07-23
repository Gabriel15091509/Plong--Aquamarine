import React, { useEffect, useState } from "react";
import { FiUploadCloud, FiChevronUp, FiChevronDown, FiX } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  getPendingSyncStatus,
  onSyncQueueResult,
  describePendingItem,
  formatElapsed,
  triggerSync,
  deletePendingItem,
} from "../../utils/syncQueue";

const REFRESH_INTERVAL_MS = 15000;

const SyncQueueBadge = () => {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const refresh = () => getPendingSyncStatus().then((status) => setItems(status.items));
    // Au montage et à chaque retour en ligne, on force une tentative d'envoi
    // immédiate : sans ça, une action mise en file restait visible même une
    // fois le réseau revenu, le navigateur ne relançant l'évènement 'sync'
    // (Background Sync) ni de façon fiable ni de façon instantanée.
    const refreshAndSync = () => {
      triggerSync();
      refresh();
    };
    refreshAndSync();

    const unsubscribe = onSyncQueueResult(({ success, failed }) => {
      if (success > 0) {
        toast.success(
          `${success} action${success > 1 ? "s" : ""} en attente envoyée${success > 1 ? "s" : ""} avec succès`,
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} action${failed > 1 ? "s" : ""} en attente a échoué (rejetée par le serveur) et a été retirée de la file`,
        );
      }
      refresh();
    });

    window.addEventListener("online", refreshAndSync);
    window.addEventListener("sync-queue-changed", refresh);
    const interval = setInterval(refreshAndSync, REFRESH_INTERVAL_MS);

    return () => {
      unsubscribe();
      window.removeEventListener("online", refreshAndSync);
      window.removeEventListener("sync-queue-changed", refresh);
      clearInterval(interval);
    };
  }, []);

  const handleDelete = (id) => {
    deletePendingItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const pending = items.length;

  // Se replie automatiquement une fois la file vidée, pour ne pas rouvrir
  // sur un panneau vide au prochain envoi en attente.
  useEffect(() => {
    if (pending === 0) setExpanded(false);
  }, [pending]);

  return (
    <AnimatePresence>
      {pending > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2"
        >
          {expanded && (
            <div className="w-72 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-2.5 text-sm flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {describePendingItem(item)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatElapsed(item.timestamp)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Abandonner cette action"
                    className="shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <FiUploadCloud className="w-4 h-4" />
            {pending} action{pending > 1 ? "s" : ""} en attente d&apos;envoi
            {expanded ? (
              <FiChevronDown className="w-4 h-4" />
            ) : (
              <FiChevronUp className="w-4 h-4" />
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyncQueueBadge;
