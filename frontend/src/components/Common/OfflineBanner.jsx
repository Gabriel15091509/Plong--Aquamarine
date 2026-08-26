import React, { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { getPrefetchStatus } from "../../utils/offlinePrefetch";
import { formatRelativeTime } from "../../utils/helpers";

// Entités dont on affiche la fraîcheur — les plus consultées hors-ligne
// (voir OFFLINE_DATASET_PATHS dans sw.js / PREFETCH_ENTRIES dans
// offlinePrefetch.js, qui en couvrent davantage) : pas la peine de citer les
// 8 dans un bandeau, seul le plus ancien horodatage parmi celles-ci est
// affiché comme indicateur global de fraîcheur.
const CLES_SURVEILLEES = ["adherents", "sorties", "inscriptions"];

// Plus ancien succès parmi les entités surveillées (le maillon le plus
// faible détermine la confiance qu'on peut avoir dans "les données sont à
// jour") ; et indique si au moins une échoue actuellement malgré un succès
// antérieur (donnée potentiellement périmée sans que l'utilisateur le sache).
function computeFreshness(status) {
  let oldestAt = null;
  let uneEnEchec = false;
  for (const key of CLES_SURVEILLEES) {
    const entry = status[key];
    if (!entry?.at) continue;
    if (oldestAt === null || entry.at < oldestAt) oldestAt = entry.at;
    if (entry.ok === false) uneEnEchec = true;
  }
  return { oldestAt, uneEnEchec };
}

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [freshness, setFreshness] = useState({ oldestAt: null, uneEnEchec: false });

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

  // Le statut n'est lu qu'au moment de passer hors-ligne (pas besoin de le
  // suivre en continu pendant qu'on est en ligne) — évite un setInterval
  // permanent pour un indicateur qui ne sert qu'une fois déconnecté.
  useEffect(() => {
    if (isOffline) setFreshness(computeFreshness(getPrefetchStatus()));
  }, [isOffline]);

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
          <span>
            Hors connexion — consultation sur les dernières données chargées.
            Les actions seront envoyées automatiquement dès le retour du
            réseau.
            {freshness.oldestAt && (
              <>
                {" "}
                Données à jour {formatRelativeTime(new Date(freshness.oldestAt))}
                {freshness.uneEnEchec &&
                  " (certaines n'ont pas pu être rafraîchies depuis)"}
                .
              </>
            )}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
