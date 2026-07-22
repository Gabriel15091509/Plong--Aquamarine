import React, { useEffect, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { getPendingSyncCount, onSyncQueueResult } from "../../utils/syncQueue";

const REFRESH_INTERVAL_MS = 15000;

const SyncQueueBadge = () => {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => getPendingSyncCount().then(setPending);
    refresh();

    const unsubscribe = onSyncQueueResult(({ success, failed }) => {
      if (success > 0) {
        toast.success(
          `${success} action${success > 1 ? "s" : ""} en attente envoyée${success > 1 ? "s" : ""} avec succès`,
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} action${failed > 1 ? "s" : ""} en attente n'a pas pu être envoyée, nouvelle tentative au prochain retour réseau`,
        );
      }
      refresh();
    });

    window.addEventListener("online", refresh);
    window.addEventListener("sync-queue-changed", refresh);
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      unsubscribe();
      window.removeEventListener("online", refresh);
      window.removeEventListener("sync-queue-changed", refresh);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {pending > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-4 right-4 z-[100] bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <FiUploadCloud className="w-4 h-4" />
          {pending} action{pending > 1 ? "s" : ""} en attente d&apos;envoi
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyncQueueBadge;
