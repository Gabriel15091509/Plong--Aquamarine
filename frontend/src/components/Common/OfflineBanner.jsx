import React, { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

// Simple indicateur de connectivité (navigator.onLine) : ne dépend plus
// d'aucun cache applicatif (le service worker qui permettait la
// consultation/rejeu hors-ligne a été retiré, voir vite.config.js et
// main.jsx) — hors-ligne, l'app se comporte normalement, c'est-à-dire que
// les requêtes échouent comme sur n'importe quel site classique.
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-md text-center"
        >
          <FiWifiOff className="w-4 h-4 shrink-0" />
          <span>Hors connexion — vérifiez votre accès internet.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
