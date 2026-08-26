import React from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import ModalOverlay from "../Common/ModalOverlay";
import SortieRouteMap from "./SortieRouteMap";

// Version agrandie de la vignette d'itinéraire (SortieRouteMapMini) affichée
// dans la liste en grille des sorties — ouverte au clic sur la vignette.
// Contrairement à la mini-carte, celle-ci calcule le vrai trajet (OSRM, via
// SortieRouteMap) puisqu'on ne l'affiche que pour UNE sortie à la fois.
const SortieRouteModal = ({ isOpen, onClose, siteLat, siteLng, siteName }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Itinéraire — {siteName || "Site de plongée"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <SortieRouteMap siteLat={siteLat} siteLng={siteLng} siteName={siteName} />
      </motion.div>
    </ModalOverlay>
  );
};

export default SortieRouteModal;
